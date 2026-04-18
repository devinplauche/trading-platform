package com.rts.stocklookup;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rts.stocklookup.stocks.FinnhubClient;
import com.rts.stocklookup.stocks.StockQuoteResponse;
import com.rts.stocklookup.stocks.SymbolSearchResult;
import com.rts.stocklookup.stocks.AssetType;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class StockControllerIT {

    @Autowired
    private MockMvc mockMvc;

        @Autowired
        private JdbcTemplate jdbcTemplate;

    @MockBean
    private FinnhubClient finnhubClient;

                private String signupAndLogin(String username) throws Exception {
                                mockMvc.perform(post("/api/auth/signup")
                                                                                                .contentType(MediaType.APPLICATION_JSON)
                                                                                                .content("""
                                                                                                                                {
                                                                                                                                        "username": "%s",
                                                                                                                                        "password": "password123"
                                                                                                                                }
                                                                                                                                """.formatted(username)))
                                                                .andExpect(status().isCreated());

                                MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                                                                                                .contentType(MediaType.APPLICATION_JSON)
                                                                                                .content("""
                                                                                                                                {
                                                                                                                                        "username": "%s",
                                                                                                                                        "password": "password123"
                                                                                                                                }
                                                                                                                                """.formatted(username)))
                                                                .andExpect(status().isOk())
                                                                .andReturn();

                                String body = loginResult.getResponse().getContentAsString();
                                return body.replaceAll("^.*\\\"token\\\":\\\"", "").replaceAll("\\\".*$", "");
                }

    @Test
    void stockLookupShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/stocks/AAPL"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authenticatedUserCanLookupStockWithAdditionalQuoteInfo() throws Exception {
        when(finnhubClient.fetchQuote("AAPL")).thenReturn(new StockQuoteResponse(
                "AAPL",
                new BigDecimal("190.10"),
                new BigDecimal("2.35"),
                new BigDecimal("1.25"),
                new BigDecimal("191.00"),
                new BigDecimal("187.40"),
                new BigDecimal("188.00"),
                new BigDecimal("187.75"),
                1713320000L
        ));

        String token = signupAndLogin("bob");

        mockMvc.perform(get("/api/stocks/AAPL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.openPrice").value(188.00))
                .andExpect(jsonPath("$.currentPrice").value(190.10))
                .andExpect(jsonPath("$.highPrice").value(191.00));
    }

    @Test
    void authenticatedUserCanGetPredictiveSearchResults() throws Exception {
        when(finnhubClient.searchSymbols("AAP")).thenReturn(List.of(
                new SymbolSearchResult("AAPL", "Apple Inc", "Common Stock"),
                new SymbolSearchResult("AAPB", "GraniteShares 2x Long AAPL", "ETF")
        ));

        String token = signupAndLogin("searcher");

        mockMvc.perform(get("/api/stocks/search")
                        .queryParam("query", "AAP")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("AAPL"))
                .andExpect(jsonPath("$[0].description").value("Apple Inc"));
    }

    @Test
    void authenticatedUserCanGetCryptoSearchResultsAndCryptoHistory() throws Exception {
        when(finnhubClient.searchSymbols("BTC")).thenReturn(List.of(
                new SymbolSearchResult("BINANCE:BTCUSDT", "Bitcoin / Tether", "Crypto"),
                new SymbolSearchResult("AAPL", "Apple Inc", "Common Stock")
        ));
        when(finnhubClient.fetchQuote("BINANCE:BTCUSDT")).thenReturn(new StockQuoteResponse(
                "BINANCE:BTCUSDT",
                new BigDecimal("68450.10"),
                new BigDecimal("935.35"),
                new BigDecimal("1.39"),
                new BigDecimal("69000.00"),
                new BigDecimal("67210.00"),
                new BigDecimal("67514.75"),
                new BigDecimal("67514.75"),
                1713320000L
        ));

        String token = signupAndLogin("cryptonaut");

        mockMvc.perform(get("/api/stocks/search")
                        .queryParam("query", "BTC")
                        .queryParam("market", AssetType.CRYPTO.name())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("BINANCE:BTCUSDT"))
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/stocks/BINANCE:BTCUSDT")
                        .queryParam("market", AssetType.CRYPTO.name())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("BINANCE:BTCUSDT"));

        mockMvc.perform(get("/api/stocks/history")
                        .queryParam("market", AssetType.CRYPTO.name())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("BINANCE:BTCUSDT"))
                .andExpect(jsonPath("$[0].assetType").value("CRYPTO"));
    }

    @Test
    void authenticatedUserCanGetOwnSearchHistory() throws Exception {
        when(finnhubClient.fetchQuote("AAPL")).thenReturn(new StockQuoteResponse(
                "AAPL",
                new BigDecimal("190.10"),
                new BigDecimal("2.35"),
                new BigDecimal("1.25"),
                new BigDecimal("191.00"),
                new BigDecimal("187.40"),
                new BigDecimal("188.00"),
                new BigDecimal("187.75"),
                1713320000L
        ));

        String token = signupAndLogin("historian");

        mockMvc.perform(get("/api/stocks/AAPL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/stocks/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("AAPL"))
                .andExpect(jsonPath("$[0].assetType").value("STOCK"))
                .andExpect(jsonPath("$[0].searchedAt").exists());
    }

        @Test
        void stockHistoryIncludesLegacyRowsWithoutAssetType() throws Exception {
                String token = signupAndLogin("legacy-user");

                jdbcTemplate.update(
                                "insert into search_history (username, symbol, searched_at, asset_type) values (?, ?, CURRENT_TIMESTAMP, null)",
                                "legacy-user",
                                "MSFT"
                );

                mockMvc.perform(get("/api/stocks/history")
                                                .queryParam("market", AssetType.STOCK.name())
                                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].symbol").value("MSFT"))
                                .andExpect(jsonPath("$[0].assetType").value("STOCK"));
        }
}
