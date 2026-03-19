import os, requests, json
from dotenv import load_dotenv
load_dotenv()
key=os.environ.get('HEALTHPOINT_API_KEY')
headers={'X-API-Key': key}
url='https://uat.healthpointapi.com/baseR4/HealthcareService?latitude=-36.8485&longitude=174.7633&radius=200.0'
resp = requests.get(url, headers=headers, timeout=20)
print('status', resp.status_code)
if resp.status_code != 200:
    print('text', resp.text[:1000])
    raise SystemExit(1)
data = resp.json()
print('resourceType', data.get('resourceType'))
print('entry len', len(data.get('entry', [])))
first = data['entry'][0]['resource']
print('first keys', list(first.keys()))
print('has extension', 'extension' in first)
print('json sample', json.dumps(first, indent=2)[:2000])
