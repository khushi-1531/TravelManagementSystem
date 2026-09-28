package com.travelsphere.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    /**
     * AI provider identifier (e.g., "openai").
     */
    private String provider = "openai";

    /**
     * API key for AI provider (kept strictly on server, never exposed to clients).
     */
    private String apiKey;

    /**
     * Model identifier (e.g., "gpt-4o-mini").
     */
    private String model = "gpt-4o-mini";

    /**
     * Base URL for the OpenAI-compatible REST API.
     */
    private String baseUrl = "https://api.openai.com/v1";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.contains("placeholder");
    }
}
