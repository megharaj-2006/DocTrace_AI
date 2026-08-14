package com.doctrace.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.mock.env.MockEnvironment;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    // Minimum 256-bit (32 byte) secret for HMAC-SHA256
    private static final String TEST_SECRET = "test_secret_must_be_at_least_32_characters_long_for_hmac";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRATION_MS, env);
    }


    @Test
    void shouldGenerateAndValidateToken() {
        String token = jwtTokenProvider.generateToken("test@example.com", "ROLE_USER");
        
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    void shouldExtractEmailFromToken() {
        String email = "investigator@example.com";
        String token = jwtTokenProvider.generateToken(email, "ROLE_INVESTIGATOR");
        
        assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo(email);
    }

    @Test
    void shouldRejectInvalidToken() {
        String token = "invalid.token.string";
        assertThat(jwtTokenProvider.validateToken(token)).isFalse();
    }
    
    @Test
    void shouldRejectExpiredToken() throws InterruptedException {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(TEST_SECRET, 1, env);

        String token = shortLivedProvider.generateToken("test@example.com", "ROLE_USER");
        
        Thread.sleep(10); // Wait for token to expire
        
        assertThat(shortLivedProvider.validateToken(token)).isFalse();
    }
}
