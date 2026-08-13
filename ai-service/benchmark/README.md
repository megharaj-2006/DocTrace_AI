# DocTrace AI — Phase 1 CPU & Resource Benchmark Suite

This directory contains the CPU performance and memory benchmark suite for `PP-DocLayout-M` layout detection and `PaddleOCR` text extraction.

## 🚀 Running the Benchmark

```bash
uv run python benchmark/benchmark_layout.py
```

## 📄 Output Files

- `results.json`: Machine-readable structured benchmark measurements.
- `results.md`: Formatted benchmark markdown report covering model load times, page inference latency, and peak RAM consumption.
