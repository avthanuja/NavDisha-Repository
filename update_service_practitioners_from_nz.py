import csv
import subprocess
from pathlib import Path

repo_dir = Path(__file__).resolve().parent
nz_csv = repo_dir / 'NZ_HealthcareService_practitioners.csv'
output_csv = repo_dir / 'service_practitioners.csv'
fetch_script = repo_dir / 'fetch_health_data.py'
python_exe = repo_dir.parent / 'healthpoint_env' / 'Scripts' / 'python.exe'

tmp_dir = repo_dir / 'tmp_practitioner_fetch'
tmp_dir.mkdir(exist_ok=True)

service_ids = []
with nz_csv.open('r', newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        sid = row.get('service_id', '').strip()
        if sid:
            service_ids.append(sid)

if not service_ids:
    raise SystemExit('No service_id values found in NZ_HealthcareService_practitioners.csv')

all_rows = []
fieldnames = None

for idx, service_id in enumerate(service_ids, 1):
    print(f'[{idx}/{len(service_ids)}] Fetching {service_id}...')
    temp_csv = tmp_dir / f'{service_id}.csv'
    cmd = [str(python_exe), str(fetch_script), '--service-id', service_id, '--output-practitioners', str(temp_csv)]
    result = subprocess.run(cmd, cwd=repo_dir, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'  ERROR for {service_id}: code {result.returncode} stdout: {result.stdout} stderr: {result.stderr}')
        continue

    with temp_csv.open('r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        if fieldnames is None:
            fieldnames = reader.fieldnames
        rows = list(reader)
        all_rows.extend(rows)

# Deduplicate using tuple of all values
seen = set()
unique_rows = []
for row in all_rows:
    key = tuple(row.get(k, '') for k in (fieldnames or []))
    if key in seen:
        continue
    seen.add(key)
    unique_rows.append(row)

if fieldnames is None:
    raise SystemExit('No output rows collected, check API / data path.')

with output_csv.open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in unique_rows:
        writer.writerow({k: row.get(k, '') for k in fieldnames})

print(f'Finished. Wrote {len(unique_rows)} rows to {output_csv}.')
print(f'Source services processed: {len(service_ids)}; successful rows from fetch: {len(all_rows)}.')
