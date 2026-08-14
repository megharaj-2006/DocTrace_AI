package com.doctrace.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration for the DocTrace AI backend.
 *
 * <p>Configures the JWT bearer-token security scheme so that Swagger UI
 * users can authenticate and test protected endpoints.</p>
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI doctraceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("DocTrace AI API")
                        .version("1.0.0")
                        .description("""
                                REST API for DocTrace AI — medical invoice template similarity \
                                and fraud detection system. Supports invoice upload, AI-powered \
                                analysis, fraud-alert management, and investigator workflows.""")
                        .contact(new Contact()
                                .name("DocTrace AI Team")))
                .addSecurityItem(new SecurityRequirement()
                        .addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token")));
    }
}
