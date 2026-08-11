# DocTrace AI — Phase 1 CPU Benchmark Report

**Generated**: 2026-08-09 12:58:45  
**Python**: 3.11.15  
**Platform**: win32 (CPU Cores: 4)

---

## 📊 Summary Metrics

| Metric | PP-DocLayout-M | PaddleOCR | Total Page Pipeline |
| :--- | :--- | :--- | :--- |
| **Model Init Time** | 5766.01 ms | 4795.1 ms | 10561.11 ms |
| **Avg Inference Latency** | 120.5 ms | 3642.14 ms | **3762.64 ms** |
| **Min / Max Latency** | 119.78 / 121.22 ms | 3628.56 / 3655.73 ms | — |

---

## 💾 Memory & Resource Consumption

- **Initial Process RAM**: 129.29 MB
- **Peak Process RAM**: **691.66 MB**
- **RAM Footprint Delta**: +562.38 MB
- **Target Page Resolution**: 1600 x 2200 px

---

## 💡 Free Tier Deployment & CPU Evaluation

1. **CPU Execution Reliability**: Models operate CPU-compatibly without GPU requirements.
2. **Page Processing Throughput**: Single-page document intelligence completes within acceptable limits for free-tier hosting timeout limits (typically 10-30s per request).
3. **RAM Memory Safety**: Total peak RAM footprint remains within typical 512MB - 1GB container limits on free hosting tiers.
