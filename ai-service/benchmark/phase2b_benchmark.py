"""Phase 2B Combined Resource & Performance Benchmark Suite.

Measures the actual integrated AI-service process:
- Phase 1: PaddleOCR + PP-DocLayout-M
- Phase 2A: DINOv2-base
- FastAPI / Application runtime
"""

import io
import json
import os
import time
from typing import Any, Dict
import numpy as np
from PIL import Image
import psutil

from app.core.config import settings
from app.document_processing.document_loader import DocumentLoader
from app.document_processing.layout_detector import LayoutDetector
from app.document_processing.ocr_service import OCRService
from app.document_processing.processor import DocumentProcessor
from app.models.dinov2_manager import DINOv2Manager
from app.services.analysis_service import AnalysisService
from app.services.embedding_service import EmbeddingService
from app.services.vector_intelligence_service import VectorIntelligenceService
from app.vector_store.mock import MockVectorStore

try:
    import torch
except ImportError:
    torch = None


def get_process_ram_mb() -> float:
    """Get current process RSS RAM memory in Megabytes."""
    process = psutil.Process(os.getpid())
    return round(process.memory_info().rss / (1024 * 1024), 2)


def run_phase2b_benchmark() -> Dict[str, Any]:
    """Run comprehensive combined resource and performance benchmark for integrated Phase 1 + Phase 2A pipeline."""
    results: Dict[str, Any] = {}

    print("=" * 60)
    print("DocTrace AI Microservice — Phase 2B Combined Benchmark")
    print("=" * 60)

    # 1. Baseline Process RAM
    baseline_ram_mb = get_process_ram_mb()
    print(f"1. Baseline Process RAM: {baseline_ram_mb:.2f} MB")
    results["baseline_ram_mb"] = baseline_ram_mb

    # 2. Phase 1 Model Loading (PaddleOCR + PP-DocLayout-M)
    t0_p1 = time.time()
    ocr_service = OCRService.get_instance()
    layout_detector = LayoutDetector.get_instance()
    phase1_load_latency_s = round(time.time() - t0_p1, 3)

    ram_after_phase1 = get_process_ram_mb()
    phase1_ram_delta_mb = round(ram_after_phase1 - baseline_ram_mb, 2)
    print(f"2. Phase 1 Model Load Time: {phase1_load_latency_s:.3f} s")
    print(f"   RAM after Phase 1 Load: {ram_after_phase1:.2f} MB (+{phase1_ram_delta_mb:.2f} MB)")

    results["phase1_load_latency_s"] = phase1_load_latency_s
    results["ram_after_phase1_mb"] = ram_after_phase1
    results["phase1_ram_overhead_mb"] = phase1_ram_delta_mb

    # 3. Phase 2A Model Loading (DINOv2-base)
    DINOv2Manager.reset_instance()
    t0_p2a = time.time()
    dinov2_manager = DINOv2Manager.get_instance()
    phase2a_load_latency_s = round(time.time() - t0_p2a, 3)

    ram_after_phase2a = get_process_ram_mb()
    combined_model_ram_mb = round(ram_after_phase2a - baseline_ram_mb, 2)
    print(f"3. Phase 2A Model Load Time: {phase2a_load_latency_s:.3f} s")
    print(f"   RAM after Both Models Loaded: {ram_after_phase2a:.2f} MB (+{combined_model_ram_mb:.2f} MB total model overhead)")

    results["phase2a_load_latency_s"] = phase2a_load_latency_s
    results["ram_after_both_models_loaded_mb"] = ram_after_phase2a
    results["combined_models_ram_overhead_mb"] = combined_model_ram_mb

    # 4. End-to-End Single-Page Invoice Benchmark
    vector_store = MockVectorStore()
    vi_service = VectorIntelligenceService(vector_store=vector_store)
    doc_processor = DocumentProcessor(
        ocr_service=ocr_service,
        layout_detector=layout_detector,
    )

    # Create temporary single page invoice image
    import tempfile
    test_img = Image.new("RGB", (800, 1000), color=(255, 255, 255))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        temp_img_path = tmp.name
        test_img.save(temp_img_path, format="PNG")

    try:
        # Pre-register reference document
        import asyncio
        asyncio.run(vi_service.register_page_embedding(temp_img_path, "REF-BENCH-001", 1))

        analysis_service = AnalysisService(
            vector_store=vector_store,
            document_processor=doc_processor,
            vector_intelligence_service=vi_service,
        )

        single_page_latencies_ms = []
        peak_ram_mb = get_process_ram_mb()

        # Warmup run
        import shutil
        from fastapi import UploadFile

        for i in range(3):
            with open(temp_img_path, "rb") as f:
                upload_file = UploadFile(filename=f"invoice_{i}.png", file=io.BytesIO(f.read()))

            t0 = time.time()
            response = asyncio.run(analysis_service.analyze_document(upload_file, f"BENCH-DOC-{i+1}"))
            lat_ms = (time.time() - t0) * 1000
            single_page_latencies_ms.append(lat_ms)

            curr_ram = get_process_ram_mb()
            if curr_ram > peak_ram_mb:
                peak_ram_mb = curr_ram

        avg_single_page_ms = round(float(np.mean(single_page_latencies_ms)), 2)
        min_single_page_ms = round(float(np.min(single_page_latencies_ms)), 2)
        max_single_page_ms = round(float(np.max(single_page_latencies_ms)), 2)

        print(f"4. End-to-End Single-Page Processing Latency: {avg_single_page_ms:.2f} ms (Min: {min_single_page_ms} ms, Max: {max_single_page_ms} ms)")
        print(f"   Peak Process RAM during Complete Pipeline Execution: {peak_ram_mb:.2f} MB")
        print(f"   Matches Found: {len(response.matchedDocuments)}, Risk Level: {response.riskLevel}")

        results["single_page_processing_latency_avg_ms"] = avg_single_page_ms
        results["single_page_processing_latency_min_ms"] = min_single_page_ms
        results["single_page_processing_latency_max_ms"] = max_single_page_ms
        results["peak_combined_process_ram_mb"] = peak_ram_mb

    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

    # 5. Device GPU/CUDA Metrics
    cuda_available = torch.cuda.is_available() if torch else False
    if cuda_available:
        gpu_name = torch.cuda.get_device_name(0)
        vram_allocated_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
        results["cuda_available"] = True
        results["gpu_name"] = gpu_name
        results["vram_allocated_mb"] = vram_allocated_mb
        print(f"5. GPU/CUDA Status: AVAILABLE ({gpu_name}, VRAM Allocated: {vram_allocated_mb} MB)")
    else:
        results["cuda_available"] = False
        results["gpu_name"] = "NOT AVAILABLE"
        results["vram_allocated_mb"] = "NOT AVAILABLE"
        print("5. GPU/CUDA Status: NOT AVAILABLE (CPU execution confirmed)")

    print("=" * 60)

    # Export machine-readable benchmark JSON
    benchmark_dir = os.path.dirname(__file__)
    json_path = os.path.join(benchmark_dir, "phase2b_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"Combined benchmark results saved to: {json_path}")
    return results


if __name__ == "__main__":
    run_phase2b_benchmark()
