import requests, os, json
from dotenv import load_dotenv

load_dotenv('C:/Users/call2/Desktop/Datascience/Project/Healthpoint/NavDisha-Repository/.env')
api_key = os.getenv('HEALTHPOINT_API_KEY')
url = 'https://uat.healthpointapi.com/baseR4/PractitionerRole?service=HealthcareService/hp-service-662377'
r = requests.get(url, headers={'x-api-key': api_key})
print(r.status_code)
print(json.dumps(r.json(), indent=2)[:1500])
