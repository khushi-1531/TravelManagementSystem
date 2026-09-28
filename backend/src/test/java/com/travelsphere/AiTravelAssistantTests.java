package com.travelsphere;

import com.travelsphere.dto.request.ChatMessageRequest;
import com.travelsphere.dto.response.ChatMessageResponse;
import com.travelsphere.entity.Booking;
import com.travelsphere.entity.ChatSession;
import com.travelsphere.entity.User;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.BookingType;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.repository.BookingRepository;
import com.travelsphere.repository.ChatMessageRepository;
import com.travelsphere.repository.ChatSessionRepository;
import com.travelsphere.repository.UserRepository;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.ChatService;
import com.travelsphere.service.ai.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AiTravelAssistantTests {

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TravelContextService travelContextService;

    @Mock
    private AiService aiService;

    @InjectMocks
    private ChatService chatService;

    private User testUser;
    private UserPrincipal testUserPrincipal;
    private User otherUser;
    private UserPrincipal otherUserPrincipal;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("traveler@travelsphere.com");
        testUser.setFullName("Arun Sharma");

        testUserPrincipal = UserPrincipal.builder()
                .id(1L)
                .uuid("test-uuid-1")
                .username("traveler")
                .email("traveler@travelsphere.com")
                .password("secret")
                .status(com.travelsphere.entity.enums.UserStatus.ACTIVE)
                .requiresPasswordChange(false)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("intruder@travelsphere.com");

        otherUserPrincipal = UserPrincipal.builder()
                .id(2L)
                .uuid("test-uuid-2")
                .username("intruder")
                .email("intruder@travelsphere.com")
                .password("secret")
                .status(com.travelsphere.entity.enums.UserStatus.ACTIVE)
                .requiresPasswordChange(false)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();
    }

    @Test
    @DisplayName("Should successfully process valid prompt and return assistant response")
    void processMessage_ValidPrompt_Success() {
        ChatMessageRequest request = ChatMessageRequest.builder()
                .message("Tell me about packages for Goa")
                .build();

        TravelContextService.ContextBundle bundle = TravelContextService.ContextBundle.builder()
                .systemPrompt("Authoritative context for Goa packages")
                .actions(Collections.emptyList())
                .suggestedPrompts(List.of("What are luxury tier options?"))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(i -> {
            ChatSession s = i.getArgument(0);
            s.setId(10L);
            return s;
        });
        when(travelContextService.buildContext(eq("Tell me about packages for Goa"), eq(testUserPrincipal), any()))
                .thenReturn(bundle);
        when(aiService.generateResponse(any(), any()))
                .thenReturn("TravelSphere offers Goa Beach Escape starting at ₹18,500.");

        ChatMessageResponse response = chatService.processMessage(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals("ASSISTANT", response.getSenderRole());
        assertEquals("TravelSphere offers Goa Beach Escape starting at ₹18,500.", response.getMessage());
        assertNotNull(response.getSessionUuid());
        assertFalse(response.getSuggestedPrompts().isEmpty());

        verify(chatMessageRepository, times(2)).save(any()); // 1 user turn, 1 assistant turn
    }

    @Test
    @DisplayName("Should reject blank or empty message with BadRequestException")
    void processMessage_BlankPrompt_ThrowsBadRequest() {
        ChatMessageRequest request = ChatMessageRequest.builder()
                .message("   ")
                .build();

        assertThrows(BadRequestException.class, () ->
                chatService.processMessage(request, testUserPrincipal));

        verify(aiService, never()).generateResponse(any(), any());
    }

    @Test
    @DisplayName("Should reject prompt exceeding 1000 characters with BadRequestException")
    void processMessage_OversizedPrompt_ThrowsBadRequest() {
        String longPrompt = "a".repeat(1001);
        ChatMessageRequest request = ChatMessageRequest.builder()
                .message(longPrompt)
                .build();

        assertThrows(BadRequestException.class, () ->
                chatService.processMessage(request, testUserPrincipal));

        verify(aiService, never()).generateResponse(any(), any());
    }

    @Test
    @DisplayName("Should enforce privacy by preventing users from accessing other users' chat sessions")
    void getSessionMessages_UnauthorizedUser_ThrowsForbidden() {
        ChatSession session = new ChatSession();
        session.setId(5L);
        session.setSessionUuid("session-uuid-123");
        session.setUser(testUser); // Belongs to user 1

        when(chatSessionRepository.findBySessionUuid("session-uuid-123")).thenReturn(Optional.of(session));

        // User 2 attempts to view User 1's chat session
        assertThrows(ForbiddenException.class, () ->
                chatService.getSessionMessages("session-uuid-123", otherUserPrincipal));

        verify(chatMessageRepository, never()).findByChatSessionIdOrderByCreatedAtAsc(any());
    }

    @Test
    @DisplayName("Should fall back to Local AI Provider when OpenAI is unconfigured or fails")
    void aiService_FallbackToLocalProvider() {
        OpenAiProvider openAiProvider = mock(OpenAiProvider.class);
        TravelSphereLocalAiProvider localProvider = mock(TravelSphereLocalAiProvider.class);

        AiService service = new AiService(openAiProvider, localProvider);

        when(openAiProvider.isConfigured()).thenReturn(true);
        when(openAiProvider.generateCompletion(any(), any())).thenThrow(new RuntimeException("Gateway Timeout"));
        when(localProvider.generateCompletion(any(), any())).thenReturn("Local fallback response");

        String result = service.generateResponse(List.of(AiMessage.user("Hello")), AiCompletionOptions.defaultOptions());

        assertEquals("Local fallback response", result);
        verify(localProvider, times(1)).generateCompletion(any(), any());
    }
}
