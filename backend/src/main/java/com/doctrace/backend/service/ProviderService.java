package com.doctrace.backend.service;

import com.doctrace.backend.dto.request.ProviderRequest;
import com.doctrace.backend.entity.Provider;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.exception.DuplicateResourceException;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.repository.ProviderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProviderService {

    private static final Logger log = LoggerFactory.getLogger(ProviderService.class);

    private final ProviderRepository providerRepository;
    private final AuditLogService auditLogService;

    public ProviderService(ProviderRepository providerRepository,
                           AuditLogService auditLogService) {
        this.providerRepository = providerRepository;
        this.auditLogService = auditLogService;
    }

    public Provider create(ProviderRequest request, User admin) {
        if (providerRepository.existsByRegistrationNumber(request.registrationNumber())) {
            throw new DuplicateResourceException("Provider", "registrationNumber", request.registrationNumber());
        }

        Provider provider = new Provider(request.name());
        provider.setRegistrationNumber(request.registrationNumber());
        provider.setAddress(request.address());
        provider.setPhone(request.phone());
        provider.setEmail(request.email());

        provider = providerRepository.save(provider);
        
        auditLogService.log(admin, "PROVIDER_CREATED", "Provider", 
                provider.getId().toString(), "Created provider: " + provider.getName());
                
        return provider;
    }

    public Provider update(Long id, ProviderRequest request, User admin) {
        Provider provider = findById(id);
        
        if (!provider.getRegistrationNumber().equals(request.registrationNumber()) &&
            providerRepository.existsByRegistrationNumber(request.registrationNumber())) {
            throw new DuplicateResourceException("Provider", "registrationNumber", request.registrationNumber());
        }

        provider.setName(request.name());
        provider.setRegistrationNumber(request.registrationNumber());
        provider.setAddress(request.address());
        provider.setPhone(request.phone());
        provider.setEmail(request.email());

        provider = providerRepository.save(provider);
        
        auditLogService.log(admin, "PROVIDER_UPDATED", "Provider", 
                provider.getId().toString(), "Updated provider: " + provider.getName());
                
        return provider;
    }

    public Provider findById(Long id) {
        return providerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", id));
    }

    public Page<Provider> findAll(Pageable pageable) {
        return providerRepository.findAll(pageable);
    }
}
