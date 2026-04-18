package com.rts.stocklookup.stocks;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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

    public StockQuoteResponse fetchQuote(String symbol) {
        Map<String, Object> response = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/quote")
                        .queryParam("symbol", symbol)
                        .queryParam("token", apiKey)
                        .build())
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("c")) {
            throw new IllegalStateException("No quote found for symbol " + symbol);
        }

        return new StockQuoteResponse(
                symbol.toUpperCase(),
                decimal(response.get("c")),
                decimal(response.get("d")),
                decimal(response.get("dp")),
                decimal(response.get("h")),
                decimal(response.get("l")),
                decimal(response.get("o")),
                decimal(response.get("pc")),
                longValue(response.get("t"))
        );
    }

    public List<SymbolSearchResult> searchSymbols(String query) {
        Map<String, Object> response = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search")
                        .queryParam("q", query)
                        .queryParam("token", apiKey)
                        .build())
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("result")) {
            return List.of();
        }

        List<?> rawResults = (List<?>) response.get("result");
        List<SymbolSearchResult> results = new ArrayList<>();

        for (Object rawResult : rawResults) {
            if (!(rawResult instanceof Map<?, ?> resultMap)) {
                continue;
            }

            Object symbolValue = resultMap.get("symbol");
            String symbol = symbolValue == null ? "" : String.valueOf(symbolValue);
            if (symbol.isBlank()) {
                continue;
            }

            Object descriptionValue = resultMap.get("description");
            Object typeValue = resultMap.get("type");
            String description = descriptionValue == null ? "" : String.valueOf(descriptionValue);
            String type = typeValue == null ? "" : String.valueOf(typeValue);
            results.add(new SymbolSearchResult(symbol, description, type));
        }

        return results.stream().limit(8).toList();
    }

    private BigDecimal decimal(Object value) {
        return new BigDecimal(String.valueOf(value));
    }

    private long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }

        return Long.parseLong(String.valueOf(value));
    }
}
