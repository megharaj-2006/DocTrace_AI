package com.doctrace.backend.repository;

import com.doctrace.backend.entity.SimilarDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SimilarDocumentRepository extends JpaRepository<SimilarDocument, Long> {

    List<SimilarDocument> findByAnalysisResultId(Long analysisResultId);

    List<SimilarDocument> findByMatchedDocumentId(String matchedDocumentId);
}
