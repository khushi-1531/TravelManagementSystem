package com.travelsphere.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service orchestrating AI completions through pluggable providers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final OpenAiProvider openAiProvider;
    private final TravelSphereLocalAiProvider travelSphereLocalAiProvider;

    /**
     * Generate an AI completion using the active or fallback provider.
     */
    public String generateResponse(List<AiMessage> messages, AiCompletionOptions options) {
        AiProvider activeProvider = resolveProvider();
        log.info("Generating travel response with active AI provider: {}", activeProvider.getProviderName());

        try {
            return activeProvider.generateCompletion(messages, options);
        } catch (Exception e) {
            log.warn("Active provider {} failed: {}. Falling back to local grounded assistant.",
                    activeProvider.getProviderName(), e.getMessage());
            return travelSphereLocalAiProvider.generateCompletion(messages, options);
        }
    }

    private AiProvider resolveProvider() {
        if (openAiProvider.isConfigured()) {
            return openAiProvider;
        }
        return travelSphereLocalAiProvider;
    }
}
