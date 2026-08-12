package com.doctrace.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * DocTrace AI Backend — Spring Boot entry point.
 *
 * <p>Central application layer between the React frontend and the Python AI
 * microservice. Handles authentication, invoice management, analysis
 * orchestration, fraud-alert workflows, and investigator dashboards.</p>
 */
@SpringBootApplication
public class DoctraceBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(DoctraceBackendApplication.class, args);
    }
}
