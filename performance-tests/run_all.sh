#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(pwd)
mkdir -p "$ROOT_DIR/performance-tests/results"

# Verify backend is reachable before running tests
echo "Verifying backend is reachable..."
if ! curl -s -f http://127.0.0.1:8080/actuator/health > /dev/null 2>&1; then
  echo "ERROR: Backend is not reachable at http://127.0.0.1:8080"
  exit 1
fi
echo "Backend is reachable!"

echo "Running baseline..."
k6 run -e BASE_URL=http://127.0.0.1:8080 performance-tests/k6/baseline.js --out json=performance-tests/results/baseline.json

echo "Running spike..."
k6 run -e BASE_URL=http://127.0.0.1:8080 performance-tests/k6/spike.js --out json=performance-tests/results/spike.json

echo "Running stress..."
k6 run -e BASE_URL=http://127.0.0.1:8080 performance-tests/k6/stress.js --out json=performance-tests/results/stress.json

echo "Generating reports..."
python3 performance-tests/report/generate_report.py performance-tests/results/baseline.json -o performance-tests/results/baseline-report -t performance-tests/report/template.html
python3 performance-tests/report/generate_report.py performance-tests/results/spike.json -o performance-tests/results/spike-report -t performance-tests/report/template.html
python3 performance-tests/report/generate_report.py performance-tests/results/stress.json -o performance-tests/results/stress-report -t performance-tests/report/template.html

echo "All done. Reports in performance-tests/results/*-report"
