package com.rts.stocklookup.stocks;

import java.math.BigDecimal;

public record StockQuoteResponse(String symbol, BigDecimal openPrice) {
}
