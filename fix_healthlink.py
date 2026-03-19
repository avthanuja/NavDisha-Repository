import os, csv, json, re
import requests
from pathlib import Path
base = Path('.')
prac_file = base / 'NZ_HealthcareService_practitioners.csv'
service_file = base / 'HealthcareService.csv'
def find_healthlink_edi(item):
    if isinstance(item, dict):
        if item.get('url') == 'healthlink-edi':
            return str(item.get('valueString','')).strip()
        for sub in item.get('extension', []) or []:
            found = find_healthlink_edi(sub)
            if found:
                return found
    elif isinstance(item, list):
        for sub in item:
            found = find_healthlink_edi(sub)
            if found:
                return found
    return ''

API_KEY = os.environ.get('HEALTHPOINT_API_KEY') or ''
HEADERS = {'X-API-Key': API_KEY} if API_KEY else {}

def fetch_healthlink_from_api(service_id):
    if not service_id:
        return ''
    if not API_KEY:
        return ''
    url = f'https://uat.healthpointapi.com/baseR4/HealthcareService/{service_id}'
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return find_healthlink_edi(data.get('extension', []))
    except Exception:
        pass
    return ''

healthlink_map = {}
with service_file.open(newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        name = r.get('name','').strip(); sid = r.get('id','').strip(); ext = r.get('extension','').strip()
        if not name and not sid: continue
        link = ''
        if ext:
            try:
                j = json.loads(ext)
            except json.JSONDecodeError:
                m = re.search(r'"healthlink-edi"\s*:\s*"([^\"]+)"', ext)
                if m:
                    link = m.group(1).strip()
            else:
                link = find_healthlink_edi(j)
        if link:
            if name: healthlink_map[name.lower()] = link
            if sid: healthlink_map[sid.lower()] = link

print('loaded', len(healthlink_map))
rows = []
with prac_file.open(newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for r in reader:
        if r.get('Healthlink_EDI','').strip():
            rows.append(r)
            continue
        val = ''
        sid = r.get('service_id','').strip().lower(); name = r.get('service_name','').strip().lower()
        if sid and sid in healthlink_map:
            val = healthlink_map[sid]
        elif name and name in healthlink_map:
            val = healthlink_map[name]
        else:
            for key, link in healthlink_map.items():
                if name and key in name:
                    val = link; break
                if name and name in key:
                    val = link; break

        if not val and sid:
            val = fetch_healthlink_from_api(sid)

        if val:
            r['Healthlink_EDI'] = val
        rows.append(r)

with prac_file.open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader(); writer.writerows(rows)

print('updated total', len(rows), 'filled', sum(1 for r in rows if r.get('Healthlink_EDI','').strip()))
for r in rows[:10]:
    if r.get('Healthlink_EDI','').strip():
        print('example', r['service_id'], r['service_name'], '=>', r['Healthlink_EDI'])
        break
