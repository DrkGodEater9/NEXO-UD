param(
  [string]$BaseUrl = 'http://localhost:8080',
  [int]$Users = 50,
  [string]$Duration = '1m'
)

$results = Join-Path -Path $PSScriptRoot -ChildPath 'results'
if (-not (Test-Path $results)) { New-Item -ItemType Directory -Path $results | Out-Null }

$env:BASE_URL = $BaseUrl
$env:USERS = $Users
$env:DURATION = $Duration

Write-Host "Running baseline..."
docker run --rm -v ${PWD}:/work -w /work grafana/k6:latest run performance-tests/k6/baseline.js --out json=performance-tests/results/baseline.json

Write-Host "Running spike..."
docker run --rm -v ${PWD}:/work -w /work grafana/k6:latest run performance-tests/k6/spike.js --out json=performance-tests/results/spike.json

Write-Host "Running stress..."
docker run --rm -v ${PWD}:/work -w /work grafana/k6:latest run performance-tests/k6/stress.js --out json=performance-tests/results/stress.json

Write-Host "Generating reports..."
python performance-tests/report/generate_report.py performance-tests/results/baseline.json -o performance-tests/results/baseline-report -t performance-tests/report/template.html
python performance-tests/report/generate_report.py performance-tests/results/spike.json -o performance-tests/results/spike-report -t performance-tests/report/template.html
python performance-tests/report/generate_report.py performance-tests/results/stress.json -o performance-tests/results/stress-report -t performance-tests/report/template.html

Write-Host "All done. Reports in performance-tests/results/*-report"
