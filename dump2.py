import requests, os, json
from dotenv import load_dotenv
load_dotenv('C:/Users/call2/Desktop/Datascience/Project/Healthpoint/NavDisha-Repository/.env')
api_key = os.getenv('HEALTHPOINT_API_KEY')
sessions = requests.Session()
url = 'https://uat.healthpointapi.com/baseR4/PractitionerRole?service=HealthcareService/hp-service-662377'
r = sessions.get(url, headers={'x-api-key': api_key})
try:
    print(json.dumps(r.json(), indent=2))
except:
    print(r.text)
