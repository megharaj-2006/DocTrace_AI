"""Phase 2A Resource & Execution Benchmark Suite."""

import json
import os
import time
from typing import Any, Dict
import numpy as np
from PIL import Image
import psutil

from app.core.config import settings
from app.models.dinov2_manager import DINOv2Manager
from app.services.embedding_service import EmbeddingService

try:
    import torch
except ImportError:
    torch = None


def get_process_ram_mb() -> float:
    """Get current process RSS RAM memory in Megabytes."""
    process = psutil.Process(os.getpid())
    return round(process.memory_info().rss / (1024 * 1024), 2)


def run_phase2a_benchmark() -> Dict[str, Any]:
    """Run comprehensive resource and latency benchmark for Phase 2A DINOv2 embedding pipeline."""
    results: Dict[str, Any] = {}

    print("=" * 60)
    print("DocTrace AI Microservice — Phase 2A Benchmark")
    print("=" * 60)

    # 1. Baseline Process RAM
    baseline_ram_mb = get_process_ram_mb()
    print(f"1. Baseline Process RAM: {baseline_ram_mb:.2f} MB")
    results["baseline_ram_mb"] = baseline_ram_mb

    # 2. DINOv2 Model Load Latency & Memory Overhead
    DINOv2Manager.reset_instance()
    t_start = time.time()
    manager = DINOv2Manager.get_instance()
    load_latency_s = round(time.time() - t_start, 3)

    ram_after_model_load = get_process_ram_mb()
    model_ram_delta_mb = round(ram_after_model_load - baseline_ram_mb, 2)

    print(f"2. Model Load Time: {load_latency_s:.3f} s")
    print(f"   RAM after Model Load: {ram_after_model_load:.2f} MB (+{model_ram_delta_mb:.2f} MB)")

    results["model_name"] = settings.EMBEDDING_MODEL
    results["device_resolved"] = manager.device
    results["model_load_latency_s"] = load_latency_s
    results["ram_after_model_load_mb"] = ram_after_model_load
    results["model_ram_overhead_mb"] = model_ram_delta_mb

    # 3. Single-Page Embedding Latency & Peak RAM
    embedding_service = EmbeddingService(dinov2_manager=manager)
    test_img = Image.new("RGB", (800, 1000), color=(240, 240, 240))

    # Warmup run
    embedding_service.generate_page_embedding(test_img, "BENCH-WARMUP", 1)

    latencies_ms = []
    peak_ram_mb = get_process_ram_mb()

    for i in range(5):
        t0 = time.time()
        embedding = embedding_service.generate_page_embedding(test_img, "BENCH-DOC", i + 1)
        lat_ms = (time.time() - t0) * 1000
        latencies_ms.append(lat_ms)

        curr_ram = get_process_ram_mb()
        if curr_ram > peak_ram_mb:
            peak_ram_mb = curr_ram

    avg_embedding_latency_ms = round(float(np.mean(latencies_ms)), 2)
    min_latency_ms = round(float(np.min(latencies_ms)), 2)
    max_latency_ms = round(float(np.max(latencies_ms)), 2)

    print(f"3. Single-Page Embedding Latency (Avg over 5 runs): {avg_embedding_latency_ms:.2f} ms (Min: {min_latency_ms} ms, Max: {max_latency_ms} ms)")
    print(f"   Peak Process RAM during Embedding: {peak_ram_mb:.2f} MB")
    print(f"   Extracted Vector Shape: ({len(embedding.vector)},), dtype: FP32")

    results["single_page_embedding_latency_avg_ms"] = avg_embedding_latency_ms
    results["single_page_embedding_latency_min_ms"] = min_latency_ms
    results["single_page_embedding_latency_max_ms"] = max_latency_ms
    results["peak_ram_during_embedding_mb"] = peak_ram_mb

    # 4. Device GPU/CUDA Metrics
    cuda_available = torch.cuda.is_available() if torch else False
    if cuda_available:
        gpu_name = torch.cuda.get_device_name(0)
        vram_allocated_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
        results["cuda_available"] = True
        results["gpu_name"] = gpu_name
        results["vram_allocated_mb"] = vram_allocated_mb
        print(f"4. GPU/CUDA Status: AVAILABLE ({gpu_name}, VRAM Allocated: {vram_allocated_mb} MB)")
    else:
        results["cuda_available"] = False
        results["gpu_name"] = "NOT AVAILABLE"
        results["vram_allocated_mb"] = "NOT AVAILABLE"
        print("4. GPU/CUDA Status: NOT AVAILABLE (CPU execution confirmed)")

    print("=" * 60)

    # Export machine-readable benchmark JSON
    benchmark_dir = os.path.dirname(__file__)
    json_path = os.path.join(benchmark_dir, "phase2a_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"Benchmark results saved to: {json_path}")
    return results


if __name__ == "__main__":
    run_phase2a_benchmark()
