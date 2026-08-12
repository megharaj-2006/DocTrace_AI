package com.doctrace.backend.integration;

import com.doctrace.backend.client.AiServiceClient;
import com.doctrace.backend.client.dto.AiAnalysisResponse;
import com.doctrace.backend.exception.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class AiServiceClientTest {

    private AiServiceClient aiServiceClient;
    private MockRestServiceServer mockServer;

    private static final String BASE_URL = "http://localhost:8000";
    private static final String API_KEY = "test-internal-key-12345";

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        this.mockServer = MockRestServiceServer.bindTo(builder).build();

        this.aiServiceClient = new AiServiceClient(BASE_URL, 5000, 60000, API_KEY);
        // Inject internal RestClient for test server mocking
        try {
            var field = AiServiceClient.class.getDeclaredField("restClient");
            field.setAccessible(true);
            field.set(aiServiceClient, builder.build());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void shouldSendInternalApiKeyHeaderAndDeserializeResponse() {
        String mockJsonResponse = """
            {
                "documentId": "INV-100",
                "fraudScore": 0.85,
                "riskLevel": "RED",
                "confidence": 0.92,
                "matchedDocuments": [
                    {"documentId": "INV-050", "similarity": 0.94}
                ],
                "reasons": ["High template similarity"]
            }
            """;

        mockServer.expect(requestTo("http://localhost:8000/api/v1/analyze"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Internal-API-Key", API_KEY))
                .andExpect(header("Content-Type", org.hamcrest.Matchers.startsWith("multipart/form-data")))
                .andRespond(withSuccess(mockJsonResponse, MediaType.APPLICATION_JSON));

        byte[] pdfContent = "%PDF-1.4 test invoice content".getBytes();
        AiAnalysisResponse response = aiServiceClient.analyze(
                pdfContent, "invoice.pdf", "application/pdf", "INV-100");

        assertThat(response).isNotNull();
        assertThat(response.documentId()).isEqualTo("INV-100");
        assertThat(response.riskLevel()).isEqualTo("RED");
        assertThat(response.fraudScore()).isEqualTo(0.85);
        assertThat(response.matchedDocuments()).hasSize(1);
        assertThat(response.matchedDocuments().get(0).documentId()).isEqualTo("INV-050");

        mockServer.verify();
    }

    @Test
    void shouldHandleAiService401UnauthorizedFailure() {
        mockServer.expect(requestTo("http://localhost:8000/api/v1/analyze"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Internal-API-Key", API_KEY))
                .andRespond(withStatus(org.springframework.http.HttpStatus.UNAUTHORIZED).body("{\"detail\": \"Invalid or missing X-Internal-API-Key header\"}"));


        byte[] pdfContent = "%PDF-1.4 test content".getBytes();

        assertThatThrownBy(() -> aiServiceClient.analyze(pdfContent, "invoice.pdf", "application/pdf", "INV-100"))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("AI service rejected analysis request");

        mockServer.verify();
    }
}
