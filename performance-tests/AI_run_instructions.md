# Instrucciones para automatizar pruebas de rendimiento con una IA

Este documento recoge TODO lo necesario para que un bot/IA ejecute, recoja y archive pruebas de estrés y rendimiento para este repositorio.

Contenido
- Requisitos
- Verificación local rápida
- Automatización con GitHub Actions (ya incluido)
- Disparar el workflow desde una IA (API GitHub)
- Ejecutar directamente en un servidor controlado por la IA
- Guardar resultados a largo plazo (S3)
- Notificaciones y alertas
- Seguridad y secretos
- Flujo recomendado para una IA
- Ejemplos de código (trigger y descarga de artifacts)

---

## 1) Requisitos
- Acceso al repositorio (permisos de escritura en Actions si usar GitHub Actions).
- Docker disponible (para usar `grafana/k6` en los scripts actuales).
- Python 3.8+ (para generar reportes con `performance-tests/report/generate_report.py`).
- (Opcional) Cuenta AWS o similar para almacenamiento a largo plazo.

## 2) Verificación local (sanity checks)

1. Crear carpeta de resultados:

```powershell
mkdir performance-tests\results
```

2. Ejecutar secuencialmente (PowerShell — Windows):

```powershell
$env:BASE_URL='http://staging.example.com'
$env:USERS='50'
$env:DURATION='1m'
.\performance-tests\run_all.ps1 -BaseUrl $env:BASE_URL -Users 50 -Duration '1m'
```

3. Ejecutar en Linux / WSL / Git Bash:

```bash
export BASE_URL='http://staging.example.com'
export USERS=50
export DURATION='1m'
chmod +x performance-tests/run_all.sh
./performance-tests/run_all.sh
```

4. Verificar que los reportes existen en `performance-tests/results/*-report/`.

---

## 3) Automatización con GitHub Actions

El repositorio incluye un workflow de ejemplo: `.github/workflows/perf-tests.yml`.

- Qué hace: ejecuta secuencialmente los escenarios (`baseline`, `spike`, `stress`) usando `run_all.sh` y genera reportes HTML/CSV con `performance-tests/report/generate_report.py`. Sube los resultados como artifact llamado `perf-reports`.
- Ejecutarlo manualmente: GitHub → Actions → `Performance Tests` → `Run workflow`.
- Cron: el workflow ya incluye un `schedule` semanal. Ajusta el `cron` en el archivo si quieres otra periodicidad.

---

## 4) Disparar el workflow desde una IA (API GitHub)

Pasos seguros:

1. Crear un Personal Access Token (PAT) en GitHub con scopes `repo` y `workflow`.
2. Guardar el token como secret en el repo (Settings → Secrets → Actions) con nombre por ejemplo `CI_TRIGGER_TOKEN`.
3. La IA ejecuta el siguiente script (o lo usa como base) para disparar el workflow y, opcionalmente, descargar artifacts.

### Ejemplo `sample_trigger.py`

```python
import os, requests, time, zipfile, io

OWNER = 'TU_USUARIO_O_ORG'
REPO = 'NEXO-UD'
WORKFLOW_FILE = 'perf-tests.yml'
REF = 'main'
TOKEN = os.environ['CI_TRIGGER_TOKEN']

headers = {'Authorization': f'token {TOKEN}', 'Accept': 'application/vnd.github+json'}

# 1) Disparar workflow
url = f'https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/{WORKFLOW_FILE}/dispatches'
resp = requests.post(url, json={'ref': REF}, headers=headers)
print('dispatch status', resp.status_code)

# 2) Esperar y buscar la ejecución más reciente
time.sleep(10)
runs_url = f'https://api.github.com/repos/{OWNER}/{REPO}/actions/runs'
runs = requests.get(runs_url, headers=headers).json()
latest = runs['workflow_runs'][0]
run_id = latest['id']
print('latest run id', run_id)

# 3) Listar artifacts
artifacts_url = f'https://api.github.com/repos/{OWNER}/{REPO}/actions/runs/{run_id}/artifacts'
arts = requests.get(artifacts_url, headers=headers).json()
print('artifacts', arts)

# 4) Descargar artifacts (ejemplo: descargar todos y extraer)
for art in arts.get('artifacts', []):
    dl = requests.get(art['archive_download_url'], headers=headers)
    z = zipfile.ZipFile(io.BytesIO(dl.content))
    extract_path = os.path.join('performance-tests', 'results', art['name'])
    os.makedirs(extract_path, exist_ok=True)
    z.extractall(path=extract_path)
    print('extracted', art['name'], 'to', extract_path)
```

Notas:
- La IA necesita almacenar el secret `CI_TRIGGER_TOKEN` o leerlo de un vault seguro.
- Ajusta `OWNER`, `REPO` y `REF` según tu repo/branch.

---

## 5) Ejecutar directamente en un servidor controlado por la IA

Si prefieres que la IA ejecute los tests directamente (sin pasar por Actions), provisiona un servidor (Ubuntu) con Docker y Python.

- Copia del repo en el servidor.
- La IA invoca `ssh` / `api` al servidor y ejecuta `performance-tests/run_all.sh`.
- Para invocaciones seguras, crea una unidad systemd que invoque el script y permite a la IA lanzar `systemctl start perf-runner`.

Ejemplo `systemd` unit:

```
[Unit]
Description=Run perf tests on demand

[Service]
Type=oneshot
WorkingDirectory=/home/ubuntu/REPO_ROOT
ExecStart=/home/ubuntu/REPO_ROOT/performance-tests/run_all.sh

[Install]
WantedBy=multi-user.target
```

---

## 6) Guardar resultados en S3 (opcional)

Instala y configura `awscli` en el servidor o en la IA. Añade al final de `run_all.sh`:

```bash
aws s3 cp performance-tests/results/ s3://mi-bucket/perf-results/$(date -u +"%Y%m%dT%H%MZ")/ --recursive
```

Guarda credenciales `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` en el entorno seguro del runner/IA.

---

## 7) Notificaciones / alertas

- Añade un paso al workflow para enviar notificación a Slack/Teams cuando termine (usar `secrets.SLACK_WEBHOOK`).

Ejemplo (GitHub Actions step):

```yaml
- name: Notify Slack
  run: |
    curl -X POST -H 'Content-type: application/json' --data '{"text":"Perf run finished, artifacts uploaded"}' ${{ secrets.SLACK_WEBHOOK }}
```

---

## 8) Seguridad y secretos

- Nunca poner secretos en el repositorio.
- En GitHub: Settings → Secrets → Actions para `CI_TRIGGER_TOKEN`, `AWS_*`, `SLACK_WEBHOOK`.
- Limitar permisos del PAT al mínimo (`repo`, `workflow`) y rotar regularmente.

---

## 9) Flujo recomendado para la IA

1. IA decide ejecutar tests (evento: despliegue a `staging` o cron).
2. IA usa el script `sample_trigger.py` (o llama la API) para disparar el workflow.
3. Workflow ejecuta `run_all.sh` y genera reportes (HTML + CSV).
4. Workflow sube artifacts `perf-reports`.
5. IA descarga artifacts y guarda en S3 / DB.
6. IA analiza `summary.csv` (p50/p95/p99, error rate) y notifica si hay regresión.

---

## 10) Ejemplo rápido: descargar artifact y procesar `summary.csv`

```python
import csv, os

path = 'performance-tests/results/baseline-report/summary.csv'
with open(path, newline='', encoding='utf-8') as f:
    r = csv.DictReader(f)
    for row in r:
        print(row['metric'], row.get('p(95)'))
```

---

## 11) Ajustes importantes según tu entorno

- `BASE_URL` debe ser accesible desde donde se ejecutan los tests (CI runner o servidor). Si usas GitHub Actions y tu staging está detrás de una red privada, considera usar un self-hosted runner dentro de esa red.
- Si el backend requiere autenticación, guarda `LOGIN_USER`/`LOGIN_PASS` como secrets y pásalos a k6. El script `baseline.js` soporta variables de entorno `LOGIN_USER` y `LOGIN_PASS`.

---

## 12) Siguientes tareas que puedo generar por ti

- `sample_trigger.py` listo (ya incluido arriba), o lo incorporo al repo como `performance-tests/scripts/sample_trigger.py`.
- Dockerized bot que decide cuándo lanzar pruebas y descarga resultados.
- Workflow adicional para `soak` en una rama/cron separada y archivado en S3.

Si quieres que añada alguno de los anteriores como archivos en el repo, dime cuál y lo creo.

Fin del documento
