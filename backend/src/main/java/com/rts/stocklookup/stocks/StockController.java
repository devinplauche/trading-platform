package com.rts.stocklookup.stocks;

import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/{symbol}")
    public StockQuoteResponse lookup(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "STOCK") AssetType market,
            Principal principal
    ) {
        return stockService.lookup(principal.getName(), symbol, market);
    }

    @GetMapping("/search")
    public List<SymbolSearchResult> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "STOCK") AssetType market
    ) {
        return stockService.searchSymbols(query, market);
    }

    @GetMapping("/history")
    public List<SearchHistoryResponse> history(
            @RequestParam(required = false) AssetType market,
            Principal principal
    ) {
        return stockService.history(principal.getName(), market);
    }
}
