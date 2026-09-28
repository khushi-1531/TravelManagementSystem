package com.travelsphere.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.config.AiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI Provider implementation communicating with OpenAI-compatible REST APIs.
 */
@Slf4j
@Component("openAiProvider")
@RequiredArgsConstructor
public class OpenAiProvider implements AiProvider {

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public String generateCompletion(List<AiMessage> messages, AiCompletionOptions options) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenAI provider is not configured with a valid API key.");
        }

        try {
            String url = aiProperties.getBaseUrl() + "/chat/completions";

            List<Map<String, String>> formattedMessages = new ArrayList<>();
            for (AiMessage msg : messages) {
                Map<String, String> m = new HashMap<>();
                m.put("role", msg.getRole());
                m.put("content", msg.getContent());
                formattedMessages.add(m);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", aiProperties.getModel());
            requestBody.put("messages", formattedMessages);
            requestBody.put("temperature", options.getTemperature());
            requestBody.put("max_tokens", options.getMaxTokens());

            String payload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + aiProperties.getApiKey())
                    .timeout(Duration.ofSeconds(25))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    JsonNode messageNode = choices.get(0).path("message");
                    return messageNode.path("content").asText("");
                }
            }

            log.warn("OpenAI API returned non-success HTTP status: {}", response.statusCode());
            throw new RuntimeException("AI provider error: HTTP " + response.statusCode());

        } catch (Exception e) {
            log.error("Error generating completion from OpenAI API: {}", e.getMessage());
            throw new RuntimeException("Failed to generate response from AI provider.", e);
        }
    }

    @Override
    public boolean isConfigured() {
        return aiProperties.isConfigured();
    }

    @Override
    public String getProviderName() {
        return "OpenAI (" + aiProperties.getModel() + ")";
    }
}
