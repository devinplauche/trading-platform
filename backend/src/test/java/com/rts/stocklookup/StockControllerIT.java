package com.rts.stocklookup;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rts.stocklookup.stocks.FinnhubClient;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class StockControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FinnhubClient finnhubClient;

    @Test
    void stockLookupShouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/stocks/AAPL"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authenticatedUserCanLookupStockOpeningPrice() throws Exception {
        when(finnhubClient.fetchOpenPrice("AAPL")).thenReturn(new BigDecimal("182.50"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "bob",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "bob",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String body = loginResult.getResponse().getContentAsString();
        String token = body.replaceAll("^.*\\\"token\\\":\\\"", "").replaceAll("\\\".*$", "");

        mockMvc.perform(get("/api/stocks/AAPL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symbol").value("AAPL"))
                .andExpect(jsonPath("$.openPrice").value(182.50));
    }
}
