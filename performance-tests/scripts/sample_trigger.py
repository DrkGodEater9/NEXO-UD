import os, requests, time, zipfile, io

OWNER = 'DrkGodEater' # Change to your actual org/user
REPO = 'NEXO-UD'
WORKFLOW_FILE = 'perf-tests.yml'
REF = 'main'
TOKEN = os.environ.get('CI_TRIGGER_TOKEN', '')

headers = {'Authorization': f'token {TOKEN}', 'Accept': 'application/vnd.github+json'}

# 1) Disparar workflow
url = f'https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/{WORKFLOW_FILE}/dispatches'
resp = requests.post(url, json={'ref': REF}, headers=headers)
print('dispatch status', resp.status_code)

if resp.status_code != 204:
    print("Error triggering workflow:", resp.text)
    exit(1)

# 2) Esperar y buscar la ejecución más reciente
time.sleep(10)
runs_url = f'https://api.github.com/repos/{OWNER}/{REPO}/actions/runs'
runs = requests.get(runs_url, headers=headers).json()
if 'workflow_runs' in runs and len(runs['workflow_runs']) > 0:
    latest = runs['workflow_runs'][0]
    run_id = latest['id']
    print('latest run id', run_id)

    # Esperar a que termine (opcional, esto puede tardar un rato)
    # Por ahora solo listamos los artifacts si los hay, aunque tomará tiempo que aparezcan
    
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
else:
    print("No recent workflow runs found.")
