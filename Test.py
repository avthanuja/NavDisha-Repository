import json
import pandas as pd

# File paths
input_file = r"C:\Users\call2\Desktop\Datascience\Project\Healthpoint\NavDisha-Repository\HealthServices.json"
output_file = r"C:\Users\call2\Desktop\Datascience\Project\Healthpoint\NavDisha-Repository\health_services_output.csv"

# Load JSON
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Helper function to extract values from extensions
def get_extension_value(extensions, key):
    if not extensions:
        return None
    for ext in extensions:
        if ext.get("url") == key:
            return ext.get("valueString")
    return None

def get_nested_extension(extensions, parent_key, child_key):
    if not extensions:
        return None
    for ext in extensions:
        if ext.get("url") == parent_key:
            for sub_ext in ext.get("extension", []):
                if sub_ext.get("url") == child_key:
                    return sub_ext.get("valueString")
    return None

# Extract fields
service_id = data.get("id")
service_name = data.get("name")

# Top-level extension
extensions = data.get("extension", [])

region = get_nested_extension(extensions, "http://www.healthpoint.co.nz/", "region")
wheelchair_access = get_nested_extension(extensions, "http://www.healthpoint.co.nz/", "wheelchair-access")

# Location extraction
city = None
latitude = None
longitude = None
phone = None
email = None

for ext in extensions:
    if ext.get("url") == "http://www.healthpoint.co.nz/":
        for sub_ext in ext.get("extension", []):
            if sub_ext.get("url") == "service-location":
                for loc_ext in sub_ext.get("extension", []):
                    
                    # City
                    if loc_ext.get("url") == "street-address":
                        city = loc_ext.get("valueAddress", {}).get("city")

                    # Coordinates
                    if loc_ext.get("url") == "coordinates":
                        for coord in loc_ext.get("extension", []):
                            if coord.get("url") == "latitude":
                                latitude = coord.get("valueDecimal")
                            if coord.get("url") == "longitude":
                                longitude = coord.get("valueDecimal")

                    # Contact
                    if loc_ext.get("url") == "phone":
                        phone = loc_ext.get("valueContactPoint", {}).get("value")
                    if loc_ext.get("url") == "email":
                        email = loc_ext.get("valueContactPoint", {}).get("value")

# Create DataFrame
df = pd.DataFrame([{
    "service_id": service_id,
    "service_name": service_name,
    "region": region,
    "city": city,
    "latitude": latitude,
    "longitude": longitude,
    "phone": phone,
    "email": email,
    "wheelchair_access": wheelchair_access
}])

# Save to CSV
df.to_csv(output_file, index=False)

print("CSV file created successfully!")