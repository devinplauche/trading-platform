package com.rts.stocklookup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.rts.stocklookup.auth.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIT {

    @Autowired
    private MockMvc mockMvc;

        @Autowired
        private AppUserRepository appUserRepository;

    @Test
    void signupAndLoginHappyPathShouldReturnJwt() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "alice",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "alice",
                                  "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void signupWithDuplicateUsernameShouldReturnBadRequest() throws Exception {
        String body = """
                {
                  "username": "duplicate",
                  "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void passwordsShouldBeStoredHashedAndSalted() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "salt_user_1",
                                  "password": "samePassword123"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "salt_user_2",
                                  "password": "samePassword123"
                                }
                                """))
                .andExpect(status().isCreated());

        String hashOne = appUserRepository.findByUsername("salt_user_1")
                .orElseThrow()
                .getPasswordHash();
        String hashTwo = appUserRepository.findByUsername("salt_user_2")
                .orElseThrow()
                .getPasswordHash();

        assertThat(hashOne).startsWith("$2");
        assertThat(hashTwo).startsWith("$2");
        assertThat(hashOne).isNotEqualTo("samePassword123");
        assertThat(hashTwo).isNotEqualTo("samePassword123");
        assertThat(hashOne).isNotEqualTo(hashTwo);
    }
}
