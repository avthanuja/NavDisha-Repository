import csv, json, re
from pathlib import Path

service_file = Path('HealthcareService.csv')
prac_file = Path('NZ_HealthcareService_practitioners.csv')


def find_healthlink_edi(item):
    if isinstance(item, dict):
        if item.get('url') == 'healthlink-edi':
            return str(item.get('valueString', '')).strip()
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


healthlink_map = {}
with service_file.open(newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        name = r.get('name', '').strip(); sid = r.get('id', '').strip(); ext = r.get('extension', '').strip()
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
            if name:
                healthlink_map[name.lower()] = link
            if sid:
                healthlink_map[sid.lower()] = link

print('service map size', len(healthlink_map))

ok = 0
missing = 0
with prac_file.open(newline='', encoding='utf-8') as f:
    r = csv.DictReader(f)
    for row in r:
        sid = row.get('service_id', '').strip().lower(); name = row.get('service_name', '').strip().lower()
        if sid in healthlink_map or name in healthlink_map:
            ok += 1
        else:
            missing += 1

print('ok', ok, 'missing', missing, 'total', ok + missing)
