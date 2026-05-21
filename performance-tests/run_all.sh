#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(pwd)
mkdir -p "$ROOT_DIR/performance-tests/results"

echo "Running baseline..."
docker run --rm -v "$ROOT_DIR":/work -w /work grafana/k6:latest run performance-tests/k6/baseline.js --out json=performance-tests/results/baseline.json

echo "Running spike..."
docker run --rm -v "$ROOT_DIR":/work -w /work grafana/k6:latest run performance-tests/k6/spike.js --out json=performance-tests/results/spike.json

echo "Running stress..."
docker run --rm -v "$ROOT_DIR":/work -w /work grafana/k6:latest run performance-tests/k6/stress.js --out json=performance-tests/results/stress.json

echo "Generating reports..."
python3 performance-tests/report/generate_report.py performance-tests/results/baseline.json -o performance-tests/results/baseline-report -t performance-tests/report/template.html
python3 performance-tests/report/generate_report.py performance-tests/results/spike.json -o performance-tests/results/spike-report -t performance-tests/report/template.html
python3 performance-tests/report/generate_report.py performance-tests/results/stress.json -o performance-tests/results/stress-report -t performance-tests/report/template.html

echo "All done. Reports in performance-tests/results/*-report"
