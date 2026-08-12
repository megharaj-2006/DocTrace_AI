package com.doctrace.backend.controller;

import com.doctrace.backend.dto.response.InvoiceResponse;
import com.doctrace.backend.entity.Invoice;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.service.FileStorageService;
import com.doctrace.backend.service.InvoiceService;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Invoices", description = "Invoice upload, retrieval, search, and management")
@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final FileStorageService fileStorageService;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public InvoiceController(InvoiceService invoiceService,
                             FileStorageService fileStorageService,
                             UserService userService,
                             EntityMapper entityMapper) {
        this.invoiceService = invoiceService;
        this.fileStorageService = fileStorageService;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "Upload a new invoice (PDF/JPG/PNG, max 20 MB)")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InvoiceResponse> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        User uploader = userService.findByEmail(userDetails.getUsername());
        Invoice invoice = invoiceService.upload(file, uploader);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(entityMapper.toInvoiceResponse(invoice));
    }

    @Operation(summary = "List all invoices (paginated)")
    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> list(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InvoiceResponse> page = invoiceService.findAll(pageable)
                .map(entityMapper::toInvoiceResponse);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "Get invoice details by ID")
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getById(@PathVariable Long id) {
        Invoice invoice = invoiceService.findById(id);
        return ResponseEntity.ok(entityMapper.toInvoiceResponse(invoice));
    }

    @Operation(summary = "Download the invoice file")
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        Invoice invoice = invoiceService.findById(id);
        Resource resource = fileStorageService.loadAsResource(invoice.getStoredFilename());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(invoice.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + invoice.getOriginalFilename() + "\"")
                .body(resource);
    }

    @Operation(summary = "Search invoices by query string")
    @GetMapping("/search")
    public ResponseEntity<Page<InvoiceResponse>> search(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InvoiceResponse> page = invoiceService.search(query, pageable)
                .map(entityMapper::toInvoiceResponse);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "Delete an invoice")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        invoiceService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
