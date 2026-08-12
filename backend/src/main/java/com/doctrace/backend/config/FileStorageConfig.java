package com.doctrace.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;

/**
 * File storage configuration. The upload directory is resolved from
 * the {@code doctrace.storage.upload-dir} property.
 */
@Configuration
public class FileStorageConfig {

    private final Path uploadDir;

    public FileStorageConfig(@Value("${doctrace.storage.upload-dir}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public Path getUploadDir() {
        return uploadDir;
    }
}
