package com.rts.stocklookup.stocks;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class StockService {

    private final FinnhubClient finnhubClient;
    private final SearchHistoryRepository searchHistoryRepository;

    public StockService(FinnhubClient finnhubClient, SearchHistoryRepository searchHistoryRepository) {
        this.finnhubClient = finnhubClient;
        this.searchHistoryRepository = searchHistoryRepository;
    }

    public StockQuoteResponse lookup(String username, String symbol, AssetType assetType) {
        String normalizedSymbol = symbol.trim().toUpperCase();
        StockQuoteResponse quote = finnhubClient.fetchQuote(normalizedSymbol);

        searchHistoryRepository.save(new SearchHistoryEntry(
                username,
                normalizedSymbol,
                assetType,
                Instant.now()
        ));

        return quote;
    }

    public List<SymbolSearchResult> searchSymbols(String query, AssetType market) {
        String normalizedQuery = query.trim();
        if (normalizedQuery.length() < 1) {
            return List.of();
        }

        return finnhubClient.searchSymbols(normalizedQuery).stream()
                .filter(result -> matchesMarket(result, market))
                .toList();
    }

    public List<SearchHistoryResponse> history(String username, AssetType market) {
        List<SearchHistoryEntry> items;
        if (market == null) {
            items = searchHistoryRepository.findTop10ByUsernameOrderBySearchedAtDesc(username);
        } else if (market == AssetType.CRYPTO) {
            items = searchHistoryRepository.findTop10ByUsernameAndAssetTypeOrderBySearchedAtDesc(username, AssetType.CRYPTO);
        } else {
            List<SearchHistoryEntry> combined = new ArrayList<>();
            combined.addAll(searchHistoryRepository.findTop10ByUsernameAndAssetTypeOrderBySearchedAtDesc(username, AssetType.STOCK));
            combined.addAll(searchHistoryRepository.findTop10ByUsernameAndAssetTypeIsNullOrderBySearchedAtDesc(username));
            items = combined.stream()
                    .sorted(Comparator.comparing(SearchHistoryEntry::getSearchedAt).reversed())
                    .limit(10)
                    .toList();
        }

        return items.stream()
                .map(item -> new SearchHistoryResponse(item.getSymbol(), item.getSearchedAt(), item.getAssetType()))
                .toList();
    }

    private boolean matchesMarket(SymbolSearchResult result, AssetType market) {
        return switch (market) {
            case STOCK -> !isCryptoResult(result);
            case CRYPTO -> isCryptoResult(result);
        };
    }

    private boolean isCryptoResult(SymbolSearchResult result) {
        String type = result.type() == null ? "" : result.type().toLowerCase(Locale.ROOT);
        String symbol = result.symbol() == null ? "" : result.symbol();
        return type.contains("crypto") || type.contains("coin") || symbol.contains(":");
    }
}
