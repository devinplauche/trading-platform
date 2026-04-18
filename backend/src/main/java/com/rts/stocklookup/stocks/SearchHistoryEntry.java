package com.rts.stocklookup.stocks;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "search_history")
public class SearchHistoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 24)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(length = 12)
    private AssetType assetType;

    @Column(nullable = false)
    private Instant searchedAt;

    protected SearchHistoryEntry() {
    }

    public SearchHistoryEntry(String username, String symbol, AssetType assetType, Instant searchedAt) {
        this.username = username;
        this.symbol = symbol;
        this.assetType = assetType == null ? AssetType.STOCK : assetType;
        this.searchedAt = searchedAt;
    }

    public String getUsername() {
        return username;
    }

    public String getSymbol() {
        return symbol;
    }

    public AssetType getAssetType() {
        return assetType == null ? AssetType.STOCK : assetType;
    }

    public Instant getSearchedAt() {
        return searchedAt;
    }
}
