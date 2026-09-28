package com.travelsphere.service.ai;

import java.util.List;

public interface AiProvider {

    /**
     * Generate an AI completion given a sequence of conversational turns and options.
     */
    String generateCompletion(List<AiMessage> messages, AiCompletionOptions options);

    /**
     * Whether this provider has valid configuration credentials available.
     */
    boolean isConfigured();

    /**
     * Display name or identifier of this provider.
     */
    String getProviderName();
}
