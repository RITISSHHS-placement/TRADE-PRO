package com.tradepro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradepro.dto.RegisterRequest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false"
})
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void refreshEndpointRotatesRefreshTokenAndReturnsNewCookies() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setName("Test User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPhone("9999999999");
        registerRequest.setPassword("Secret123!");
        registerRequest.setDeviceId("device-123");
        registerRequest.setDeviceName("JUnit Browser");
        registerRequest.setIpAddress("127.0.0.1");
        registerRequest.setUserAgent("JUnit");

        MvcResult registerResult = mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isCreated())
            .andExpect(cookie().exists("access_token"))
            .andExpect(cookie().exists("refresh_token"))
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.user.email").value("test@example.com"))
            .andReturn();

        Cookie refreshCookie = findCookie(registerResult.getResponse().getCookies(), "refresh_token");
        assertThat(refreshCookie).isNotNull();
        String originalRefreshToken = refreshCookie.getValue();
        assertThat(originalRefreshToken).isNotBlank();

        MvcResult refreshResult = mockMvc.perform(post("/auth/refresh")
                .cookie(refreshCookie))
            .andExpect(status().isOk())
            .andExpect(cookie().exists("access_token"))
            .andExpect(cookie().exists("refresh_token"))
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.user.email").value("test@example.com"))
            .andReturn();

        Cookie refreshedCookie = findCookie(refreshResult.getResponse().getCookies(), "refresh_token");
        assertThat(refreshedCookie).isNotNull();
        assertThat(refreshedCookie.getValue()).isNotBlank();
        assertThat(refreshedCookie.getValue()).isNotEqualTo(originalRefreshToken);
    }

    private Cookie findCookie(Cookie[] cookies, String name) {
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie;
            }
        }
        return null;
    }
}
