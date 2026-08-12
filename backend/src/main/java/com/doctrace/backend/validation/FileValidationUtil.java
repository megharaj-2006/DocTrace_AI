package com.doctrace.backend.validation;

import com.doctrace.backend.exception.InvalidFileException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;

/**
 * Validates uploaded files before storage.
 * Checks extension, MIME content type, and performs a magic-byte sniff
 * to prevent files masquerading as a different type.
 */
public final class FileValidationUtil {

    /** Maximum file size: 20 MB per the frozen AI contract. */
    public static final long MAX_FILE_SIZE = 20L * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("pdf", "jpg", "jpeg", "png");

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("application/pdf", "image/jpeg", "image/png");

    // Magic bytes for file type sniffing
    private static final byte[] PDF_MAGIC  = { 0x25, 0x50, 0x44, 0x46 };         // %PDF
    private static final byte[] PNG_MAGIC  = { (byte)0x89, 0x50, 0x4E, 0x47 };   // ‰PNG
    private static final byte[] JPEG_MAGIC = { (byte)0xFF, (byte)0xD8, (byte)0xFF };

    private FileValidationUtil() {}

    /**
     * Validate the uploaded file completely: emptiness, extension, MIME type,
     * size, and magic-byte content sniffing.
     *
     * @throws InvalidFileException if any check fails
     */
    public static void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File is required and must not be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidFileException("File size exceeds maximum allowed 20 MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new InvalidFileException("Filename is required");
        }

        // Extension check
        String extension = extractExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidFileException(
                    "Unsupported file type: ." + extension +
                    ". Allowed: PDF, JPG, JPEG, PNG");
        }

        // MIME content type check
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidFileException(
                    "Unsupported content type: " + contentType +
                    ". Allowed: application/pdf, image/jpeg, image/png");
        }

        // Magic bytes sniff
        validateMagicBytes(file, extension);
    }

    /**
     * Extract file extension from a filename.
     */
    public static String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            throw new InvalidFileException("File must have a valid extension");
        }
        return filename.substring(dotIndex + 1);
    }

    private static void validateMagicBytes(MultipartFile file, String extension) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            int bytesRead = is.read(header);
            if (bytesRead < 3) {
                throw new InvalidFileException("File appears to be empty or corrupted");
            }

            boolean valid = switch (extension) {
                case "pdf"  -> startsWith(header, PDF_MAGIC);
                case "png"  -> startsWith(header, PNG_MAGIC);
                case "jpg", "jpeg" -> startsWith(header, JPEG_MAGIC);
                default -> false;
            };

            if (!valid) {
                throw new InvalidFileException(
                        "File content does not match its extension (." + extension + ")");
            }
        } catch (IOException e) {
            throw new InvalidFileException("Unable to read file for validation");
        }
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
