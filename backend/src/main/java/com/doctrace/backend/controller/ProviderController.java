package com.doctrace.backend.controller;

import com.doctrace.backend.dto.request.ProviderRequest;
import com.doctrace.backend.dto.response.InvoiceResponse;
import com.doctrace.backend.dto.response.ProviderResponse;
import com.doctrace.backend.entity.Provider;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.service.InvoiceService;
import com.doctrace.backend.service.ProviderService;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Providers", description = "Healthcare provider / hospital management")
@RestController
@RequestMapping("/api/v1/providers")
public class ProviderController {

    private final ProviderService providerService;
    private final InvoiceService invoiceService;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public ProviderController(ProviderService providerService,
                              InvoiceService invoiceService,
                              UserService userService,
                              EntityMapper entityMapper) {
        this.providerService = providerService;
        this.invoiceService = invoiceService;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "List all providers")
    @GetMapping
    public ResponseEntity<Page<ProviderResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        Page<ProviderResponse> page = providerService.findAll(pageable)
                .map(entityMapper::toProviderResponse);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "Get provider details by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ProviderResponse> getById(@PathVariable Long id) {
        Provider provider = providerService.findById(id);
        return ResponseEntity.ok(entityMapper.toProviderResponse(provider));
    }

    @Operation(summary = "List invoices for a specific provider")
    @GetMapping("/{id}/invoices")
    public ResponseEntity<Page<InvoiceResponse>> getProviderInvoices(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        // verify provider exists
        providerService.findById(id);
        
        Page<InvoiceResponse> page = invoiceService.findByProviderId(id, pageable)
                .map(entityMapper::toInvoiceResponse);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "Create a new provider (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ProviderResponse> create(
            @Valid @RequestBody ProviderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userService.findByEmail(userDetails.getUsername());
        Provider provider = providerService.create(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(entityMapper.toProviderResponse(provider));
    }

    @Operation(summary = "Update an existing provider (ADMIN only)")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ProviderResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProviderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userService.findByEmail(userDetails.getUsername());
        Provider provider = providerService.update(id, request, admin);
        return ResponseEntity.ok(entityMapper.toProviderResponse(provider));
    }
}
