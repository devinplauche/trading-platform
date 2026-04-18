package com.rts.stocklookup.stocks;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class StockService {

    private final FinnhubClient finnhubClient;

    public StockService(FinnhubClient finnhubClient) {
        this.finnhubClient = finnhubClient;
    }

    public StockQuoteResponse lookup(String symbol) {
        BigDecimal openPrice = finnhubClient.fetchOpenPrice(symbol);
        return new StockQuoteResponse(symbol.toUpperCase(), openPrice);
    }
}
