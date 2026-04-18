package com.rts.stocklookup.stocks;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SearchHistoryRepository extends JpaRepository<SearchHistoryEntry, Long> {
    List<SearchHistoryEntry> findTop10ByUsernameOrderBySearchedAtDesc(String username);

                List<SearchHistoryEntry> findTop10ByUsernameAndAssetTypeOrderBySearchedAtDesc(String username, AssetType assetType);

                List<SearchHistoryEntry> findTop10ByUsernameAndAssetTypeIsNullOrderBySearchedAtDesc(String username);
}
