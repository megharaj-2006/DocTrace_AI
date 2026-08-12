package com.doctrace.backend.service;

import com.doctrace.backend.entity.Invoice;
import com.doctrace.backend.entity.InvoiceStatus;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.repository.InvoiceRepository;
import com.doctrace.backend.validation.FileValidationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Invoice lifecycle management: upload, retrieval, search, deletion.
 */
@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    private final InvoiceRepository invoiceRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          FileStorageService fileStorageService,
                          AuditLogService auditLogService) {
        this.invoiceRepository = invoiceRepository;
        this.fileStorageService = fileStorageService;
        this.auditLogService = auditLogService;
    }

    /**
     * Upload and persist a new invoice.
     */
    @Transactional
    public Invoice upload(MultipartFile file, User uploader) {
        FileValidationUtil.validate(file);

        String storedFilename = fileStorageService.store(file);
        String documentId = generateDocumentId();

        Invoice invoice = new Invoice();
        invoice.setDocumentId(documentId);
        invoice.setUploadedBy(uploader);
        invoice.setOriginalFilename(file.getOriginalFilename());
        invoice.setStoredFilename(storedFilename);
        invoice.setFilePath(storedFilename); // relative to upload dir
        invoice.setContentType(file.getContentType());
        invoice.setFileSize(file.getSize());
        invoice.setStatus(InvoiceStatus.UPLOADED);

        invoice = invoiceRepository.save(invoice);

        log.info("Invoice uploaded: documentId={}, file={}", documentId, file.getOriginalFilename());
        auditLogService.log(uploader, "INVOICE_UPLOADED", "Invoice",
                invoice.getId().toString(),
                "Uploaded: " + file.getOriginalFilename());

        return invoice;
    }

    public Invoice findById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
    }

    public Invoice findByIdForUser(Long id, User user) {
        Invoice invoice = findById(id);
        validateAccess(invoice, user);
        return invoice;
    }

    public Invoice findByDocumentId(String documentId) {
        return invoiceRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "documentId", documentId));
    }

    public Page<Invoice> findAll(Pageable pageable) {
        return invoiceRepository.findAll(pageable);
    }

    public Page<Invoice> findAllForUser(User user, Pageable pageable) {
        if (user.getRole() == Role.ROLE_ADMIN || user.getRole() == Role.ROLE_INVESTIGATOR) {
            return invoiceRepository.findAll(pageable);
        }
        return invoiceRepository.findByUploadedById(user.getId(), pageable);
    }

    public Page<Invoice> findByUploader(Long userId, Pageable pageable) {
        return invoiceRepository.findByUploadedById(userId, pageable);
    }

    public Page<Invoice> findByProviderId(Long providerId, Pageable pageable) {
        return invoiceRepository.findByProviderId(providerId, pageable);
    }

    public Page<Invoice> search(String query, Pageable pageable) {
        return invoiceRepository.search(query, pageable);
    }

    public Page<Invoice> searchForUser(String query, User user, Pageable pageable) {
        if (user.getRole() == Role.ROLE_ADMIN || user.getRole() == Role.ROLE_INVESTIGATOR) {
            return invoiceRepository.search(query, pageable);
        }
        return invoiceRepository.searchForUser(query, user.getId(), pageable);
    }

    public void validateAccess(Invoice invoice, User user) {
        if (user.getRole() == Role.ROLE_ADMIN || user.getRole() == Role.ROLE_INVESTIGATOR) {
            return;
        }
        if (invoice.getUploadedBy() == null || !invoice.getUploadedBy().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Invoice", "id", invoice.getId());
        }
    }


    private String generateDocumentId() {
        return "INV-" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 12).toUpperCase();
    }
}
