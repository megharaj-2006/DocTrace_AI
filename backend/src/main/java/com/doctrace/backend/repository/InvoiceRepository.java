package com.doctrace.backend.repository;

import com.doctrace.backend.entity.Invoice;
import com.doctrace.backend.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByDocumentId(String documentId);

    boolean existsByDocumentId(String documentId);

    Page<Invoice> findByUploadedById(Long userId, Pageable pageable);

    Page<Invoice> findByProviderId(Long providerId, Pageable pageable);

    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);

    @Query("""
            SELECT i FROM Invoice i
            WHERE (:query IS NULL
                OR LOWER(i.documentId) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.originalFilename) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.patientName) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Invoice> search(@Param("query") String query, Pageable pageable);

    long countByStatus(InvoiceStatus status);
}
