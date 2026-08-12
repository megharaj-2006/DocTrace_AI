package com.doctrace.backend.client;

import com.doctrace.backend.client.dto.AiAnalysisResponse;
import com.doctrace.backend.exception.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * HTTP client for the Python AI microservice.
 *
 * <p>Sends invoices to {@code POST /api/v1/analyze} and deserializes the
 * frozen response schema. Handles connection failures, timeouts, HTTP errors,
 * and malformed responses.</p>
 *
 * <p>Spring Boot never calculates fraud scores, similarity, or risk levels.
 * Those are the AI service's responsibility.</p>
 */
@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);
    private static final String ANALYZE_PATH = "/api/v1/analyze";
    private static final String INTERNAL_HEADER = "X-Internal-API-Key";

    private final RestClient restClient;
    private final String internalApiKey;

    public AiServiceClient(
            @Value("${doctrace.ai-service.url}") String baseUrl,
            @Value("${doctrace.ai-service.connect-timeout-ms}") long connectTimeoutMs,
            @Value("${doctrace.ai-service.read-timeout-ms}") long readTimeoutMs,
            @Value("${doctrace.ai-service.internal-api-key:dev-internal-secret-key-12345}") String internalApiKey) {

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.toIntExact(connectTimeoutMs));
        requestFactory.setReadTimeout(Math.toIntExact(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.internalApiKey = internalApiKey;

        log.info("AI service client configured: baseUrl={}, connectTimeout={}ms, readTimeout={}ms",
                baseUrl, connectTimeoutMs, readTimeoutMs);
    }

    /**
     * Send an invoice to the AI service for analysis.
     *
     * @param fileBytes    the raw invoice file content
     * @param filename     original filename for the multipart part
     * @param contentType  MIME type of the file
     * @param documentId   the authoritative business document ID
     * @return the frozen AI analysis response
     * @throws AiServiceException on any communication or processing failure
     */
    public AiAnalysisResponse analyze(byte[] fileBytes, String filename,
                                       String contentType, String documentId) {
        log.info("Sending analysis request to AI service: documentId={}, fileSize={}",
                documentId, fileBytes.length);

        try {
            // Build the multipart body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // File part
            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(contentType));
            HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(fileResource, fileHeaders);
            body.add("file", filePart);

            // documentId part
            body.add("documentId", documentId);

            // Execute the request
            AiAnalysisResponse response = restClient.post()
                    .uri(ANALYZE_PATH)
                    .header(INTERNAL_HEADER, internalApiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(AiAnalysisResponse.class);

            if (response == null) {
                throw new AiServiceException("AI service returned empty response");
            }

            log.info("AI analysis complete: documentId={}, riskLevel={}, fraudScore={}",
                    response.documentId(), response.riskLevel(), response.fraudScore());

            return response;

        } catch (HttpClientErrorException e) {
            log.error("AI service client error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiServiceException("AI service rejected analysis request: " + e.getStatusText(), e);

        } catch (HttpServerErrorException e) {
            log.error("AI service server error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiServiceException("AI service encountered an internal error", e);

        } catch (ResourceAccessException e) {
            log.error("AI service unreachable or timed out: {}", e.getMessage());
            throw new AiServiceException("AI service is unreachable or request timed out", e);

        } catch (AiServiceException e) {
            throw e;

        } catch (Exception e) {
            log.error("Unexpected error calling AI service: {}", e.getMessage(), e);
            throw new AiServiceException("Unexpected error communicating with AI service", e);
        }
    }
}

