package com.doctrace.backend.controller;

import com.doctrace.backend.dto.response.AnalysisResultResponse;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.repository.AnalysisResultRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Analysis Registry", description = "Global listing of document analysis results")
@RestController
@RequestMapping("/api/v1/analysis")
@Transactional(readOnly = true)
public class GlobalAnalysisController {

    private final AnalysisResultRepository analysisResultRepository;
    private final EntityMapper entityMapper;

    public GlobalAnalysisController(AnalysisResultRepository analysisResultRepository,
                                    EntityMapper entityMapper) {
        this.analysisResultRepository = analysisResultRepository;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "Get all invoice analysis results (paginated, latest first)")
    @GetMapping
    public ResponseEntity<Page<AnalysisResultResponse>> listAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AnalysisResultResponse> page = analysisResultRepository.findAll(pageable)
                .map(entityMapper::toAnalysisResultResponse);
        return ResponseEntity.ok(page);
    }
}
