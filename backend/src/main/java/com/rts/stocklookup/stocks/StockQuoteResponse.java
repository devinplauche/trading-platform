package com.rts.stocklookup.stocks;

import java.math.BigDecimal;

public record StockQuoteResponse(
	String symbol,
	BigDecimal currentPrice,
	BigDecimal change,
	BigDecimal percentChange,
	BigDecimal highPrice,
	BigDecimal lowPrice,
	BigDecimal openPrice,
	BigDecimal previousClose,
	long quoteTimestamp
) {
}
