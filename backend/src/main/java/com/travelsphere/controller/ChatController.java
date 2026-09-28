package com.travelsphere.controller;

import com.travelsphere.dto.request.ChatMessageRequest;
import com.travelsphere.dto.response.ApiResponse;
import com.travelsphere.dto.response.ChatMessageResponse;
import com.travelsphere.dto.response.ChatSessionResponse;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for TravelSphere AI Travel Assistant.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Send a natural language message to the AI Travel Assistant.
     * Supports both authenticated customers and discovery visitors.
     */
    @PostMapping("/message")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ChatMessageResponse response = chatService.processMessage(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Message processed successfully.", response));
    }

    /**
     * List all chat sessions belonging to the authenticated customer.
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> getSessions(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ChatSessionResponse> sessions = chatService.getUserSessions(currentUser);
        return ResponseEntity.ok(ApiResponse.success("Chat sessions retrieved successfully.", sessions));
    }

    /**
     * Retrieve all messages within a specific conversation session.
     */
    @GetMapping("/sessions/{uuid}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getSessionMessages(
            @PathVariable String uuid,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ChatMessageResponse> messages = chatService.getSessionMessages(uuid, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Session messages retrieved successfully.", messages));
    }

    /**
     * Delete a chat session.
     */
    @DeleteMapping("/sessions/{uuid}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String uuid,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        chatService.deleteSession(uuid, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Chat session deleted successfully.", null));
    }
}
