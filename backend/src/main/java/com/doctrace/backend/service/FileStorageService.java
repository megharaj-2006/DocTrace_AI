package com.doctrace.backend.service;

import com.doctrace.backend.config.FileStorageConfig;
import com.doctrace.backend.exception.FileStorageException;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.validation.FileValidationUtil;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Manages invoice file storage on the local filesystem.
 *
 * <p>Files are stored with UUID-based names to prevent collisions and
 * path-traversal attacks. The original filename is preserved only as metadata
 * in the database.</p>
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final Path uploadDir;

    public FileStorageService(FileStorageConfig config) {
        this.uploadDir = config.getUploadDir();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
            log.info("Upload directory initialized: {}", uploadDir);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + uploadDir, e);
        }
    }

    /**
     * Store the file with a safe UUID-based name. Returns the stored filename.
     */
    public String store(MultipartFile file) {
        String extension = FileValidationUtil.extractExtension(
                file.getOriginalFilename()).toLowerCase();
        String storedFilename = UUID.randomUUID() + "." + extension;
        Path targetPath = uploadDir.resolve(storedFilename).normalize();

        // Prevent path traversal
        if (!targetPath.startsWith(uploadDir)) {
            throw new FileStorageException("Cannot store file outside upload directory");
        }

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.debug("File stored: {}", storedFilename);
            return storedFilename;
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + storedFilename, e);
        }
    }

    /**
     * Load a stored file as a Spring Resource for streaming downloads.
     */
    public Resource loadAsResource(String storedFilename) {
        Path filePath = uploadDir.resolve(storedFilename).normalize();

        // Prevent path traversal
        if (!filePath.startsWith(uploadDir)) {
            throw new FileStorageException("Invalid file path");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException("File not found: " + storedFilename);
        } catch (MalformedURLException e) {
            throw new FileStorageException("Invalid file path: " + storedFilename, e);
        }
    }

    /**
     * Delete a stored file.
     */
    public void delete(String storedFilename) {
        Path filePath = uploadDir.resolve(storedFilename).normalize();
        if (!filePath.startsWith(uploadDir)) {
            throw new FileStorageException("Invalid file path");
        }
        try {
            Files.deleteIfExists(filePath);
            log.debug("File deleted: {}", storedFilename);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", storedFilename, e);
        }
    }

    public Path getUploadDir() {
        return uploadDir;
    }
}
