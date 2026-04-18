package com.rts.stocklookup.stocks;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class FinnhubClient {

    private final RestClient restClient;
    private final String apiKey;

    public FinnhubClient(
            @Value("${app.finnhub.base-url}") String baseUrl,
            @Value("${app.finnhub.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    public BigDecimal fetchOpenPrice(String symbol) {
        Map<String, Object> response = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/quote")
                        .queryParam("symbol", symbol)
                        .queryParam("token", apiKey)
                        .build())
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("o")) {
            throw new IllegalStateException("No opening price found for symbol " + symbol);
        }

        return new BigDecimal(String.valueOf(response.get("o")));
    }
}
