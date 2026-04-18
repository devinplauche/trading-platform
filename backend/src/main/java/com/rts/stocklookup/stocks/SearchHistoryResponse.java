package com.rts.stocklookup.stocks;

import java.time.Instant;

public record SearchHistoryResponse(String symbol, Instant searchedAt, AssetType assetType) {
}
