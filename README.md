# Healthpoint API Data Fetcher

This script fetches clinic data from the Healthpoint API (using the UAT FHIR HealthcareService query at uat.healthpointapi.com/baseR4/HealthcareService?).

## Prerequisites

- Python 3.x (Download from https://www.python.org/downloads/ or install via Microsoft Store)
- Create and activate a virtual environment:
  ```
  C:\Users\call2\AppData\Local\Microsoft\WindowsApps\python.exe -m venv healthpoint_env
  healthpoint_env\Scripts\Activate.ps1
  ```
- Install dependencies: `pip install -r requirements.txt`

## Usage

1. Create a `.env` file in the project root and add your API key:
   ```
   HEALTHPOINT_API_KEY=your_actual_api_key_here
   ```

2. Activate your virtual environment (if not already active):
   ```
   healthpoint_env\Scripts\Activate.ps1  # PowerShell
   # or
   healthpoint_env\Scripts\activate.bat  # cmd
   ```

3. Run the script with optional filters. By default outputs to CSV:
   ```
   python fetch_health_data.py                                 # writes results.csv
   python fetch_health_data.py --region "Auckland"             # filter by region
   python fetch_health_data.py --region "Wellington" --category 700232004
   python fetch_health_data.py --region "Christchurch" --output services_data.csv
   python fetch_health_data.py --output data.json              # save as JSON instead
   ```

The CSV includes columns: id, name, organization, category, type, contact_phone, contact_email, region, address, doctors.

The script fetches healthcare services and includes doctors associated with each service in the region. Use the `--region` parameter to filter by region.

## Troubleshooting

- Ensure your API key is correct and has the necessary permissions.
- Check if the API endpoint is accessible.
- If the data format is different, modify the parsing logic in the script.