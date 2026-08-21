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

    @Override
    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider WHERE i.id = :id")
    Optional<Invoice> findById(@Param("id") Long id);

    @Override
    @Query(value = "SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider",
           countQuery = "SELECT COUNT(i) FROM Invoice i")
    Page<Invoice> findAll(Pageable pageable);

    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider WHERE i.documentId = :documentId")
    Optional<Invoice> findByDocumentId(@Param("documentId") String documentId);

    boolean existsByDocumentId(String documentId);

    @Query(value = "SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider WHERE i.uploadedBy.id = :userId",
           countQuery = "SELECT COUNT(i) FROM Invoice i WHERE i.uploadedBy.id = :userId")
    Page<Invoice> findByUploadedById(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider WHERE i.provider.id = :providerId",
           countQuery = "SELECT COUNT(i) FROM Invoice i WHERE i.provider.id = :providerId")
    Page<Invoice> findByProviderId(@Param("providerId") Long providerId, Pageable pageable);

    @Query(value = "SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider WHERE i.status = :status",
           countQuery = "SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    Page<Invoice> findByStatus(@Param("status") InvoiceStatus status, Pageable pageable);

    @Query(value = """
            SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider
            WHERE (:query IS NULL
                OR LOWER(i.documentId) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.originalFilename) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.patientName) LIKE LOWER(CONCAT('%', :query, '%')))
            """,
           countQuery = """
            SELECT COUNT(i) FROM Invoice i
            WHERE (:query IS NULL
                OR LOWER(i.documentId) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.originalFilename) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.patientName) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Invoice> search(@Param("query") String query, Pageable pageable);

    @Query(value = """
            SELECT i FROM Invoice i LEFT JOIN FETCH i.uploadedBy LEFT JOIN FETCH i.provider
            WHERE i.uploadedBy.id = :userId
              AND (:query IS NULL
                OR LOWER(i.documentId) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.originalFilename) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.patientName) LIKE LOWER(CONCAT('%', :query, '%')))
            """,
           countQuery = """
            SELECT COUNT(i) FROM Invoice i
            WHERE i.uploadedBy.id = :userId
              AND (:query IS NULL
                OR LOWER(i.documentId) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.originalFilename) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(i.patientName) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    Page<Invoice> searchForUser(@Param("query") String query, @Param("userId") Long userId, Pageable pageable);

    long countByStatus(InvoiceStatus status);
}


