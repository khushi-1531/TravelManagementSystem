package com.travelsphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    /**
     * User's natural language question or prompt.
     */
    @NotBlank(message = "Message cannot be empty.")
    @Size(max = 1000, message = "Message must not exceed 1000 characters.")
    private String message;

    /**
     * Optional existing conversational session identifier.
     */
    private String sessionUuid;

    /**
     * Optional contextual destination ID if chatting from a specific destination page.
     */
    @Positive(message = "Destination ID must be greater than zero")
    private Long destinationId;
}
