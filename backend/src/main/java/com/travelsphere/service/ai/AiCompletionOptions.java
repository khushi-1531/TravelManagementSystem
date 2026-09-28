package com.travelsphere.service.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCompletionOptions {

    @Builder.Default
    private double temperature = 0.7;

    @Builder.Default
    private int maxTokens = 800;

    public static AiCompletionOptions defaultOptions() {
        return AiCompletionOptions.builder().build();
    }
}
