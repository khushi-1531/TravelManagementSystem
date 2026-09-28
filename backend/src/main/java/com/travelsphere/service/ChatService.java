package com.travelsphere.service;

import com.travelsphere.dto.request.ChatMessageRequest;
import com.travelsphere.dto.response.ChatMessageResponse;
import com.travelsphere.dto.response.ChatSessionResponse;
import com.travelsphere.entity.ChatMessage;
import com.travelsphere.entity.ChatSession;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.MessageRole;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.exception.ResourceNotFoundException;
import com.travelsphere.repository.ChatMessageRepository;
import com.travelsphere.repository.ChatSessionRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.ai.AiCompletionOptions;
import com.travelsphere.service.ai.AiMessage;
import com.travelsphere.service.ai.AiService;
import com.travelsphere.service.ai.TravelContextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing conversational AI sessions, database grounding, and chat history.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final TravelContextService travelContextService;
    private final AiService aiService;

    /**
     * Process an incoming natural language message from a user.
     * Injects grounded TravelSphere context and maintains multi-turn conversation memory.
     */
    @Transactional
    public ChatMessageResponse processMessage(ChatMessageRequest request, UserPrincipal currentUser) {
        String cleanMessage = (request.getMessage() != null) ? request.getMessage().trim() : "";
        if (cleanMessage.isBlank()) {
            throw new BadRequestException("Message cannot be empty or whitespace.");
        }
        if (cleanMessage.length() > 1000) {
            throw new BadRequestException("Message length exceeds the maximum allowed 1000 characters.");
        }

        ChatSession session = null;
        String sessionUuid = request.getSessionUuid();

        // If user is authenticated, resolve or create persistent session
        if (currentUser != null) {
            User user = userRepository.findById(currentUser.getId()).orElse(null);
            if (user != null) {
                if (sessionUuid != null && !sessionUuid.isBlank()) {
                    session = chatSessionRepository.findBySessionUuid(sessionUuid).orElse(null);
                    if (session != null) {
                        verifySessionOwnership(session, currentUser);
                    }
                }

                if (session == null) {
                    session = new ChatSession();
                    session.setUser(user);
                    session.setSessionUuid(UUID.randomUUID().toString());
                    String title = cleanMessage.length() > 35 ? cleanMessage.substring(0, 32) + "..." : cleanMessage;
                    session.setSessionTitle(title);
                    session = chatSessionRepository.save(session);
                }
                sessionUuid = session.getSessionUuid();
            }
        }

        if (sessionUuid == null || sessionUuid.isBlank()) {
            sessionUuid = UUID.randomUUID().toString();
        }

        // Build database-grounded context
        TravelContextService.ContextBundle context = travelContextService.buildContext(
                cleanMessage, currentUser, request.getDestinationId()
        );

        // Assemble conversational prompt sequence
        List<AiMessage> aiMessages = new ArrayList<>();
        aiMessages.add(AiMessage.system(context.getSystemPrompt()));

        // If authenticated and session exists, load recent turns (up to 8 messages)
        if (session != null) {
            List<ChatMessage> history = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
            int startIndex = Math.max(0, history.size() - 8);
            for (int i = startIndex; i < history.size(); i++) {
                ChatMessage hist = history.get(i);
                String role = (hist.getSenderRole() == MessageRole.USER) ? "user" : "assistant";
                aiMessages.add(new AiMessage(role, hist.getContent()));
            }
        }

        // Append current user message
        aiMessages.add(AiMessage.user(cleanMessage));

        // Generate response via AI Service
        String assistantResponse = aiService.generateResponse(aiMessages, AiCompletionOptions.defaultOptions());

        LocalDateTime now = LocalDateTime.now();

        // If authenticated, persist conversation turns
        if (session != null) {
            ChatMessage userMsg = new ChatMessage();
            userMsg.setChatSession(session);
            userMsg.setSenderRole(MessageRole.USER);
            userMsg.setContent(cleanMessage);
            userMsg.setCreatedAt(now.minusSeconds(1));
            chatMessageRepository.save(userMsg);

            ChatMessage assistantMsg = new ChatMessage();
            assistantMsg.setChatSession(session);
            assistantMsg.setSenderRole(MessageRole.ASSISTANT);
            assistantMsg.setContent(assistantResponse);
            assistantMsg.setCreatedAt(now);
            chatMessageRepository.save(assistantMsg);
        }

        return ChatMessageResponse.builder()
                .message(assistantResponse)
                .sessionUuid(sessionUuid)
                .senderRole("ASSISTANT")
                .suggestedPrompts(context.getSuggestedPrompts())
                .referencedActions(context.getActions())
                .createdAt(now)
                .build();
    }

    /**
     * Retrieve all chat sessions belonging to the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getUserSessions(UserPrincipal currentUser) {
        if (currentUser == null) {
            return List.of();
        }

        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return sessions.stream().map(s -> {
            List<ChatMessage> msgs = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(s.getId());
            return ChatSessionResponse.builder()
                    .sessionUuid(s.getSessionUuid())
                    .sessionTitle(s.getSessionTitle())
                    .createdAt(s.getCreatedAt())
                    .updatedAt(s.getUpdatedAt())
                    .messageCount(msgs != null ? msgs.size() : 0)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Retrieve all messages in a specific chat session with ownership protection.
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getSessionMessages(String sessionUuid, UserPrincipal currentUser) {
        ChatSession session = chatSessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found: " + sessionUuid));

        verifySessionOwnership(session, currentUser);

        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
        return messages.stream().map(m -> ChatMessageResponse.builder()
                .message(m.getContent())
                .sessionUuid(session.getSessionUuid())
                .senderRole(m.getSenderRole() != null ? m.getSenderRole().name() : "USER")
                .createdAt(m.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    /**
     * Delete a chat session and all associated messages.
     */
    @Transactional
    public void deleteSession(String sessionUuid, UserPrincipal currentUser) {
        ChatSession session = chatSessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found: " + sessionUuid));

        verifySessionOwnership(session, currentUser);
        chatSessionRepository.delete(session);
        log.info("Deleted chat session {} for user ID {}", sessionUuid, currentUser.getId());
    }

    private void verifySessionOwnership(ChatSession session, UserPrincipal currentUser) {
        if (currentUser == null || session.getUser() == null
                || !session.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You do not have permission to access this chat session.");
        }
    }
}
