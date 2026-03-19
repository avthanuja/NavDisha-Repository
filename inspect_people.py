import os, requests, json
key = os.environ.get('HEALTHPOINT_API_KEY')
if not key:
    raise ValueError('No API key')
headers = {'X-API-Key': key}
url = 'https://uat.healthpointapi.com/baseR4/HealthcareService/_search?_id=hp-service-32242&_format=json'
r = requests.get(url, headers=headers, timeout=20)
print('status', r.status_code)
print(r.text[:1000])
if r.status_code != 200:
    raise SystemExit(1)

data = r.json()
service = data['entry'][0]['resource']
print('ext count', len(service.get('extension', [])))
for i, ext in enumerate(service.get('extension', [])[:30]):
    print(i, ext.get('url'), 'ext count', len(ext.get('extension', []) or []))
    if ext.get('url') == 'people-list':
        for p in ext.get('extension', []) or []:
            print('   -->', p.get('url'), p.get('valueReference'), p.get('valueString'))
