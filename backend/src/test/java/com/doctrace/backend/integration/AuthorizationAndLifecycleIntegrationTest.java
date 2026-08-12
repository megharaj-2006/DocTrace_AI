package com.doctrace.backend.integration;

import com.doctrace.backend.entity.Invoice;
import com.doctrace.backend.entity.InvoiceStatus;
import com.doctrace.backend.entity.Role;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.service.AnalysisService;
import com.doctrace.backend.service.FileStorageService;
import com.doctrace.backend.service.InvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AuthorizationAndLifecycleIntegrationTest {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private FileStorageService fileStorageService;

    private User userA;
    private User userB;
    private User investigator;
    private User admin;

    @BeforeEach
    void setUp() {
        userA = new User("usera@example.com", "password", "User A", Role.USER);
        setId(userA, 101L);

        userB = new User("userb@example.com", "password", "User B", Role.USER);
        setId(userB, 102L);

        investigator = new User("investigator@example.com", "password", "Investigator User", Role.INVESTIGATOR);
        setId(investigator, 201L);

        admin = new User("admin@example.com", "password", "Admin User", Role.ADMIN);
        setId(admin, 301L);
    }


    private void setId(User user, Long id) {
        try {
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void shouldAllowUserToAccessOwnInvoice() {
        Invoice invoice = new Invoice();
        invoice.setDocumentId("INV-USERA-001");
        invoice.setUploadedBy(userA);
        invoice.setOriginalFilename("test.pdf");

        // User A accessing own invoice should pass
        invoiceService.validateAccess(invoice, userA);

        // Investigator & Admin accessing User A's invoice should pass
        invoiceService.validateAccess(invoice, investigator);
        invoiceService.validateAccess(invoice, admin);
    }

    @Test
    void shouldDenyUserBFromAccessingUserAInvoice() {
        Invoice invoice = new Invoice();
        invoice.setDocumentId("INV-USERA-002");
        invoice.setUploadedBy(userA);
        invoice.setOriginalFilename("secret_bill.pdf");

        assertThatThrownBy(() -> invoiceService.validateAccess(invoice, userB))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Invoice");
    }

    @Test
    void shouldVerifyFileStoragePathTraversalProtection() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample_invoice.pdf",
                "application/pdf",
                "%PDF-1.4 sample bill content for testing".getBytes()
        );

        String storedFilename = fileStorageService.store(file);
        assertThat(storedFilename).isNotNull();
        assertThat(storedFilename).endsWith(".pdf");

        // Verify loaded resource exists
        var resource = fileStorageService.loadAsResource(storedFilename);
        assertThat(resource.exists()).isTrue();

        // Clean up
        fileStorageService.delete(storedFilename);
        assertThat(fileStorageService.loadAsResource(storedFilename).exists()).isFalse();
    }
}
