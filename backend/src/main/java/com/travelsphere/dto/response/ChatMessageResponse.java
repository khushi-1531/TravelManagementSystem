package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessageResponse {

    /**
     * Assistant's sanitized response text formatted with markdown/bullet points.
     */
    private String message;

    /**
     * Associated conversational session UUID.
     */
    private String sessionUuid;

    /**
     * Sender role identifier (ASSISTANT).
     */
    private String senderRole;

    /**
     * Dynamic contextual next-question suggestions.
     */
    private List<String> suggestedPrompts;

    /**
     * Actionable navigation pills for mentioned destinations, packages, hotels, or bookings.
     */
    private List<ChatAction> referencedActions;

    /**
     * Message creation timestamp.
     */
    private LocalDateTime createdAt;
}
