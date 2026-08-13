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

    public Invoice findByDocumentId(String documentId) {
        return invoiceRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "documentId", documentId));
    }

    public Page<Invoice> findAll(Pageable pageable) {
        return invoiceRepository.findAll(pageable);
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

    @Transactional
    public void delete(Long id, User user) {
        Invoice invoice = findById(id);
        fileStorageService.delete(invoice.getStoredFilename());
        invoiceRepository.delete(invoice);

        log.info("Invoice deleted: id={}, documentId={}", id, invoice.getDocumentId());
        auditLogService.log(user, "INVOICE_DELETED", "Invoice",
                id.toString(), "Deleted: " + invoice.getDocumentId());
    }

    private String generateDocumentId() {
        return "INV-" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 12).toUpperCase();
    }
}
