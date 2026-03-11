import requests
import os
import argparse
import json
import csv
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API details
API_URL = "https://uat.healthpointapi.com/baseR4/HealthcareService?"
API_KEY = os.environ.get('HEALTHPOINT_API_KEY')

if not API_KEY:
    print("Please set the HEALTHPOINT_API_KEY environment variable (in .env or the environment).")
    exit(1)

# Headers for authentication
headers = {
    'X-API-Key': API_KEY
}

# parse optional query parameters from command line
parser = argparse.ArgumentParser(description='Fetch HealthcareService records from Healthpoint API')
parser.add_argument('--category', help='SNOMED category code (e.g. 700232004)')
parser.add_argument('--type', help='SNOMED type code (e.g. 34043003)')
parser.add_argument('--location', help='Location ID or name to filter by')
parser.add_argument('--region', help='Region name (e.g. Auckland, Wellington)')
parser.add_argument('--output', help='Path to output file (JSON or CSV)', default='results.csv')
args = parser.parse_args()

params = {}
if args.category:
    params['category'] = args.category
if args.type:
    params['type'] = args.type
if args.location:
    params['location'] = args.location
if args.region:
    params['region'] = args.region

try:
    response = requests.get(API_URL, headers=headers, params=params)
    response.raise_for_status()  # Raise an error for bad status codes

    data = response.json()

    # Determine output format based on file extension
    output_format = 'csv' if args.output.endswith('.csv') else 'json'

    if output_format == 'json':
        # Write JSON output
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Saved JSON response to {args.output}")
    else:
        # Parse FHIR HealthcareService bundle and extract data
        services = []
        
        if isinstance(data, dict) and 'entry' in data:
            # FHIR bundle response
            for entry in data.get('entry', []):
                resource = entry.get('resource', {})
                if resource.get('resourceType') == 'HealthcareService':
                    service = {
                        'id': resource.get('id', ''),
                        'name': resource.get('name', ''),
                        'organization': resource.get('providedBy', {}).get('display', ''),
                        'category': ', '.join([c.get('text', '') for c in resource.get('category', [])]),
                        'type': ', '.join([t.get('text', '') for t in resource.get('type', [])]),
                        'contact_phone': '',
                        'contact_email': '',
                        'region': '',
                        'address': '',
                        'doctors': ''
                    }
                    
                    # Extract contact info
                    for contact in resource.get('telecom', []):
                        system = contact.get('system', '')
                        value = contact.get('value', '')
                        if system == 'phone':
                            service['contact_phone'] = value
                        elif system == 'email':
                            service['contact_email'] = value
                    
                    # Extract location/address info
                    coverage_area = resource.get('coverageArea', [])
                    if coverage_area:
                        service['region'] = coverage_area[0].get('display', '')
                    
                    service_locations = resource.get('location', [])
                    if service_locations:
                        service['address'] = service_locations[0].get('display', '')
                    
                    # Extract practitioners/doctors associated with this service
                    practitioners = resource.get('providedBy', [])
                    if practitioners and isinstance(practitioners, list):
                        doctor_names = [p.get('display', '') for p in practitioners if p.get('display')]
                        service['doctors'] = '; '.join(doctor_names)
                    
                    services.append(service)
                
                elif resource.get('resourceType') == 'PractitionerRole':
                    # Also extract from PractitionerRole if available
                    practitioner = resource.get('practitioner', {})
                    healthcare_service = resource.get('healthcareService', [])
                    specialty = ', '.join([s.get('text', '') for s in resource.get('specialty', [])])
                    
                    if healthcare_service:
                        service_name = healthcare_service[0].get('display', 'N/A') if isinstance(healthcare_service, list) else 'N/A'
                        service = {
                            'id': '',
                            'name': service_name,
                            'organization': resource.get('organization', {}).get('display', ''),
                            'category': specialty,
                            'type': '',
                            'contact_phone': '',
                            'contact_email': '',
                            'region': '',
                            'address': '',
                            'doctors': practitioner.get('display', '')
                        }
                        services.append(service)
        
        elif isinstance(data, list):
            # Direct list of resources
            for resource in data:
                if resource.get('resourceType') == 'HealthcareService':
                    service = {
                        'id': resource.get('id', ''),
                        'name': resource.get('name', ''),
                        'organization': resource.get('providedBy', {}).get('display', ''),
                        'category': ', '.join([c.get('text', '') for c in resource.get('category', [])]),
                        'type': ', '.join([t.get('text', '') for t in resource.get('type', [])]),
                        'contact_phone': '',
                        'contact_email': '',
                        'region': '',
                        'address': '',
                        'doctors': ''
                    }
                    
                    for contact in resource.get('telecom', []):
                        system = contact.get('system', '')
                        value = contact.get('value', '')
                        if system == 'phone':
                            service['contact_phone'] = value
                        elif system == 'email':
                            service['contact_email'] = value
                    
                    coverage_area = resource.get('coverageArea', [])
                    if coverage_area:
                        service['region'] = coverage_area[0].get('display', '')
                    
                    service_locations = resource.get('location', [])
                    if service_locations:
                        service['address'] = service_locations[0].get('display', '')
                    
                    practitioners = resource.get('providedBy', [])
                    if practitioners and isinstance(practitioners, list):
                        doctor_names = [p.get('display', '') for p in practitioners if p.get('display')]
                        service['doctors'] = '; '.join(doctor_names)
                    
                    services.append(service)
                
                elif resource.get('resourceType') == 'PractitionerRole':
                    practitioner = resource.get('practitioner', {})
                    healthcare_service = resource.get('healthcareService', [])
                    specialty = ', '.join([s.get('text', '') for s in resource.get('specialty', [])])
                    
                    if healthcare_service:
                        service_name = healthcare_service[0].get('display', 'N/A') if isinstance(healthcare_service, list) else 'N/A'
                        service = {
                            'id': '',
                            'name': service_name,
                            'organization': resource.get('organization', {}).get('display', ''),
                            'category': specialty,
                            'type': '',
                            'contact_phone': '',
                            'contact_email': '',
                            'region': '',
                            'address': '',
                            'doctors': practitioner.get('display', '')
                        }
                        services.append(service)
        
        # Write CSV output
        if services:
            fieldnames = ['id', 'name', 'organization', 'category', 'type', 'contact_phone', 'contact_email', 'region', 'address', 'doctors']
            with open(args.output, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(services)
            print(f"Saved {len(services)} healthcare services with doctor information to {args.output} (CSV)")
        else:
            print("No healthcare resources found in response.")
            # Still save the raw response as JSON for debugging
            with open(args.output.replace('.csv', '.json'), 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"Saved raw response to {args.output.replace('.csv', '.json')} for debugging.")

except requests.exceptions.RequestException as e:
    print(f"Error fetching data: {e}")