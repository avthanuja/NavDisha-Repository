import re
import csv
from pathlib import Path

INPUT_PATH = Path(r"C:\Users\call2\Desktop\Datascience\Project\Healthpoint\NavDisha-Repository\HealthServices.json")
OUTPUT_PATH = Path(r"C:\Users\call2\Desktop\Datascience\Project\Healthpoint\NavDisha-Repository\HealthcareService_output.csv")


def find1(pattern, text, flags=0, default=''):
    m = re.search(pattern, text, flags)
    return m.group(1).strip() if m else default


def extract():
    raw = INPUT_PATH.read_text(encoding='utf-8')

    service_id = find1(r'id\s*:\s*"([^"]+)"', raw)
    service_name = find1(r'name\s*:\s*"([^"]+)"', raw)

    wheelchair_access = find1(r'url\s*:\s*"wheelchair-access".*?valueString\s*:\s*"([^"]+)"', raw, re.S)
    region = find1(r'url\s*:\s*"region".*?valueString\s*:\s*"([^"]+)"', raw, re.S)

    city = find1(r'url\s*:\s*"street-address".*?city\s*:\s*"([^"]+)"', raw, re.S)

    latitude = find1(r'url\s*:\s*"latitude".*?valueDecimal\s*:\s*([-0-9.]+)', raw, re.S)
    longitude = find1(r'url\s*:\s*"longitude".*?valueDecimal\s*:\s*([-0-9.]+)', raw, re.S)

    phone = find1(r'system\s*:\s*"phone".*?value\s*:\s*"([^"]+)"', raw, re.S)
    email = find1(r'system\s*:\s*"email".*?value\s*:\s*"([^"]+)"', raw, re.S)

    if not phone:
        phone = find1(r'url\s*:\s*"phone".*?valueContactPoint\s*:\s*\{[^}]*?value\s*:\s*"([^"]+)"', raw, re.S)
    if not email:
        email = find1(r'url\s*:\s*"email".*?valueContactPoint\s*:\s*\{[^}]*?value\s*:\s*"([^"]+)"', raw, re.S)

    return [{
        'service_id': service_id,
        'service_name': service_name,
        'region': region,
        'city': city,
        'latitude': latitude,
        'longitude': longitude,
        'phone': phone,
        'email': email,
        'wheelchair_access': wheelchair_access,
    }]


def main():
    rows = extract()

    with OUTPUT_PATH.open('w', newline='', encoding='utf-8') as f:
        fieldnames = ['service_id','service_name','region','city','latitude','longitude','phone','email','wheelchair_access']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f'Wrote {len(rows)} row(s) to {OUTPUT_PATH}')


if __name__ == '__main__':
    main()
