Performance testing scaffolding for this repository.

Overview
- Scripts to run with `k6` are under `performance-tests/k6/`.
- A small Python tool converts `k6` JSON output into `CSV` and `HTML` reports: `performance-tests/report/generate_report.py`.

Prerequisites
- Install `k6`: https://k6.io/docs/getting-started/installation
- Python 3.8+ and a virtualenv

Quick setup (Windows PowerShell)
```powershell
cd performance-tests/report
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run examples

- Baseline (adjust env vars as needed):
```powershell
$env:BASE_URL='http://staging.example.com'
$env:USERS='50'
$env:DURATION='1m'
k6 run performance-tests/k6/baseline.js --out json=performance-tests/results/baseline.json
```

- Spike
```powershell
$env:BASE_URL='http://staging.example.com'
k6 run performance-tests/k6/spike.js --out json=performance-tests/results/spike.json
```

- Soak (long running)
```powershell
$env:BASE_URL='http://staging.example.com'
$env:VUS='30'
$env:DURATION='6h'
k6 run performance-tests/k6/soak.js --out json=performance-tests/results/soak.json
```

- Stress
```powershell
$env:BASE_URL='http://staging.example.com'
k6 run performance-tests/k6/stress.js --out json=performance-tests/results/stress.json
```

Generate report from a k6 JSON result
```powershell
cd performance-tests/report
.\.venv\Scripts\Activate.ps1
python generate_report.py ..\results\baseline.json -o ..\results\baseline-report -t template.html
```

Notes
- Replace the placeholder endpoints in the k6 scripts with real endpoints from `nexo-backend`.
- Use `--out json=...` to capture results that the report generator can consume.
- Consider integrating Prometheus/Grafana and JVM profiling (JFR/async-profiler) for richer metrics.

Docker (Prometheus + Grafana)
-------------------------------
Se incluye un `docker-compose` mínimo en `performance-tests/docker/` para levantar Prometheus, Grafana y node-exporter.

Arrancar el stack:
```powershell
cd performance-tests/docker
docker-compose up -d
```

- Grafana estará en `http://localhost:3000` (usuario: `admin`, contraseña: `admin`).
- Prometheus estará en `http://localhost:9090`.

Notas:
- El `prometheus.yml` por defecto intenta scrapear `host.docker.internal:8080/actuator/prometheus` para `nexo-backend`. Ajusta la URL si tu backend expone métricas en otra ruta o puerto.
- Puedes usar `node-exporter` para métricas del host. En Windows, la integración de node-exporter con contenedor es limitada; úsalo principalmente en entornos Linux.

CI: GitHub Actions
------------------
Se incluye un workflow de ejemplo que ejecuta el escenario `baseline` y sube el JSON de resultados como artifact: `.github/workflows/perf-tests.yml`.

Para ejecutar manualmente desde GitHub: en la pestaña `Actions` selecciona `Performance Tests` y presiona `Run workflow`.
Después de la ejecución, descarga el artifact `perf-baseline-results` desde la página del workflow.

El workflow ahora ejecuta `baseline` y `spike`, genera reportes HTML/CSV y sube los reportes como artifact `perf-reports`.

Contenido del artifact `perf-reports`:
- `performance-tests/results/*.json` — JSON raw de k6
- `performance-tests/results/*-report/report.html` y `summary.csv` — reportes generados

Si necesitas agregar más escenarios al CI, edita `.github/workflows/perf-tests.yml` y añade llamadas adicionales a `k6 run` y al generador de reportes.

