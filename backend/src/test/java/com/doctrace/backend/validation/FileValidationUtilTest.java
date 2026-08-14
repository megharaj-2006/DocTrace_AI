package com.doctrace.backend.validation;

import com.doctrace.backend.exception.InvalidFileException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileValidationUtilTest {

    // Magic bytes: %PDF
    private static final byte[] VALID_PDF_CONTENT = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};

    @Test
    void shouldPassValidPdf() {
        MultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", VALID_PDF_CONTENT);

        assertThatCode(() -> FileValidationUtil.validate(file))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRejectUnsupportedExtension() {
        MultipartFile file = new MockMultipartFile(
                "file", "invoice.txt", "text/plain", "content".getBytes());

        assertThatThrownBy(() -> FileValidationUtil.validate(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Unsupported file type: .txt");
    }

    @Test
    void shouldRejectMimeTypeMismatch() {
        // Has .pdf extension, but text/plain mime type
        MultipartFile file = new MockMultipartFile(
                "file", "invoice.pdf", "text/plain", VALID_PDF_CONTENT);

        assertThatThrownBy(() -> FileValidationUtil.validate(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Unsupported content type");
    }

    @Test
    void shouldRejectSpoofedMagicBytes() {
        // Has .pdf extension and application/pdf mime type, but content is just text (no %PDF magic bytes)
        MultipartFile file = new MockMultipartFile(
                "file", "fake.pdf", "application/pdf", "Not a real PDF file".getBytes());

        assertThatThrownBy(() -> FileValidationUtil.validate(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("does not match its extension (.pdf)");
    }

    @Test
    void shouldRejectEmptyFile() {
        MultipartFile file = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> FileValidationUtil.validate(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("empty");
    }
}
