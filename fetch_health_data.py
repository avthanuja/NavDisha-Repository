import os
import json
import csv
import time
import argparse
import requests
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def get_env_key(key):
    # first check existing environment
    value = os.environ.get(key)
    if value:
        return value

    # fallback to local .env in script directory
    env_path = Path(__file__).resolve().parent / '.env'
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' not in line:
                continue
            k, v = line.split('=', 1)
            if k.strip() == key:
                v = v.strip().strip('"').strip("'")
                return v

    return None


API_KEY = get_env_key('HEALTHPOINT_API_KEY')
if not API_KEY:
    print('Please set the HEALTHPOINT_API_KEY environment variable (in .env or the environment).')
    exit(1)

headers = {'X-API-Key': API_KEY}

parser = argparse.ArgumentParser(description='Fetch HealthcareService data and map all fields.')
parser.add_argument('--url',
                    help='HealthcareService endpoint URL',
                    default='https://uat.healthpointapi.com/baseR4/HealthcareService?branch-code=primary&region=Southland')
parser.add_argument('--latitude', type=float, help='Latitude to search around (New Zealand).')
parser.add_argument('--longitude', type=float, help='Longitude to search around (New Zealand).')
parser.add_argument('--radius', type=float, default=200,
                    help='Search radius in km around the given lat/lon (approx map server semantics).')
parser.add_argument('--grid', action='store_true',
                    help='Perform multiple lat/lon points across NZ to collect more clinics.')
parser.add_argument('--output', help='Output CSV path', default='HealthcareService.csv')
parser.add_argument('--max-pages', type=int, default=50,
                    help='Maximum pages to follow per anchor URL to avoid unbounded loops.')
parser.add_argument('--retry-count', type=int, default=3,
                    help='Number of retries on timeout or 429 responses.')
parser.add_argument('--retry-delay', type=float, default=1.0,
                    help='Seconds to wait between retries (exponential backoff multiplier applied).')
parser.add_argument('--verbose', action='store_true',
                    help='Print detailed progress messages to stdout.')
parser.add_argument('--log', help='Optional file path to write log output.')
parser.add_argument('--per-practitioner', action='store_true',
                    help='Emit one CSV row per practitioner with clinic metadata.')
parser.add_argument('--service-id', help='HealthcareService ID to fetch and expand practitioner data (hp-service-xxxxx).')
parser.add_argument('--output-practitioners', default='service_practitioners.csv',
                    help='Output CSV path for service-practitioner expansion.')
args = parser.parse_args()


def flatten_value(val):
    if val is None:
        return ''
    if isinstance(val, str):
        return val
    if isinstance(val, (int, float, bool)):
        return str(val)
    return json.dumps(val, ensure_ascii=False)


def extract_healthcareservices(data):
    services = []
    if isinstance(data, dict):
        if data.get('resourceType') == 'Bundle':
            for entry in data.get('entry', []):
                res = entry.get('resource')
                if isinstance(res, dict) and res.get('resourceType') == 'HealthcareService':
                    services.append(res)
        elif data.get('resourceType') == 'HealthcareService':
            services.append(data)
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and item.get('resourceType') == 'HealthcareService':
                services.append(item)
    return services


def format_codeable_concept(concept):
    if not isinstance(concept, dict):
        return ''
    text = concept.get('text', '')
    if text:
        return text
    coding = concept.get('coding', []) or []
    parts = []
    for c in coding:
        if isinstance(c, dict):
            if c.get('display'):
                parts.append(c.get('display'))
            elif c.get('code'):
                parts.append(c.get('code'))
    return '; '.join(parts)


def get_single_value(obj, *keys):
    for key in keys:
        if isinstance(obj, dict) and key in obj and obj[key] is not None:
            return obj[key]
    return ''


def find_extensions(container, url):
    results = []
    if isinstance(container, dict):
        for ext in container.get('extension', []) or []:
            if not isinstance(ext, dict):
                continue
            if ext.get('url') == url:
                results.append(ext)
            results.extend(find_extensions(ext, url))
    elif isinstance(container, list):
        for element in container:
            results.extend(find_extensions(element, url))
    return results


def extract_clinic_fields(service):
    def get_ext(url):
        exts = find_extensions(service, url)
        return exts[0] if exts else None

    service_id = service.get('id', '')
    service_name = service.get('name', '')

    wheelchair_access = ''
    ext_wheel = get_ext('wheelchair-access')
    if isinstance(ext_wheel, dict):
        wheelchair_access = get_single_value(ext_wheel, 'valueString', 'valueBoolean') or ''

    healthlink_edi = ''
    ext_healthlink = get_ext('healthlink-edi')
    if isinstance(ext_healthlink, dict):
        healthlink_edi = get_single_value(ext_healthlink, 'valueString') or ''

    region = ''
    ext_region = get_ext('region') or get_ext('dhb-region')
    if isinstance(ext_region, dict):
        region = get_single_value(ext_region, 'valueString')
    if not region and service.get('coverageArea'):
        cov = service.get('coverageArea')
        if isinstance(cov, list) and cov:
            region = get_single_value(cov[0], 'display')

    # location info from service-location extension or location reference
    city = ''
    latitude = ''
    longitude = ''

    ext_location = get_ext('service-location')
    if isinstance(ext_location, dict):
        nested = ext_location.get('extension', []) or []
        for e in nested:
            if not isinstance(e, dict):
                continue
            if e.get('url') == 'street-address':
                addr = e.get('valueAddress', {})
                if isinstance(addr, dict):
                    city = city or addr.get('city', '')
            if e.get('url') == 'coordinates':
                coords = e.get('extension', []) or []
                for c in coords:
                    if not isinstance(c, dict):
                        continue
                    if c.get('url') == 'latitude':
                        latitude = latitude or str(c.get('valueDecimal', ''))
                    if c.get('url') == 'longitude':
                        longitude = longitude or str(c.get('valueDecimal', ''))

    if not city:
        # fallback to first location with address
        locations = service.get('location', [])
        if isinstance(locations, list) and locations:
            for loc in locations:
                if not isinstance(loc, dict):
                    continue
                display = loc.get('display', '')
                if display:
                    city = display
                    break

    # fallback to telecom
    phone = ''
    email = ''
    for t in service.get('telecom', []) or []:
        if not isinstance(t, dict):
            continue
        if t.get('system') == 'phone' and t.get('value'):
            phone = phone or t.get('value')
        if t.get('system') == 'email' and t.get('value'):
            email = email or t.get('value')

    return {
        'service_id': service_id,
        'service_name': service_name,
        'region': region,
        'city': city,
        'latitude': latitude,
        'longitude': longitude,
        'phone': phone,
        'email': email,
        'wheelchair_access': wheelchair_access,
        'Healthlink_EDI': healthlink_edi,
    }


def extract_practitioner_rows(service):
    clinic = extract_clinic_fields(service)
    practitioner_rows = []

    people_extensions = find_extensions(service, 'people-list')

    for people_ext in people_extensions:
        person_name = ''
        person_type = ''
        person_title = ''

        for pext in people_ext.get('extension', []) or []:
            if not isinstance(pext, dict):
                continue
            if pext.get('url') == 'person' and isinstance(pext.get('valueReference'), dict):
                person_name = pext['valueReference'].get('display', '') or person_name
            elif pext.get('url') == 'person-type':
                person_type = pext.get('valueString', '') or person_type
            elif pext.get('url') == 'person-title':
                person_title = pext.get('valueString', '') or person_title

        if person_name or person_type or person_title:
            r = clinic.copy()
            r.update({
                'practitioner_name': person_name,
                'practitioner_type': person_type,
                'practitioner_title': person_title,
            })
            practitioner_rows.append(r)

    if not practitioner_rows:
        r = clinic.copy()
        r.update({'practitioner_name': '', 'practitioner_type': '', 'practitioner_title': ''})
        practitioner_rows.append(r)

    return practitioner_rows


def extract_field(service):
    row = extract_clinic_fields(service)
    practitioner_rows = extract_practitioner_rows(service)

    # Join practitioner data into one cell for service-level CSV.
    names = [x.get('practitioner_name', '') for x in practitioner_rows if x.get('practitioner_name')]
    types = [x.get('practitioner_type', '') for x in practitioner_rows if x.get('practitioner_type')]
    titles = [x.get('practitioner_title', '') for x in practitioner_rows if x.get('practitioner_title')]

    row['practitioner_name'] = '; '.join(names)
    row['practitioner_type'] = '; '.join(types)
    row['practitioner_title'] = '; '.join(titles)

    if 'Healthlink_EDI' not in row:
        row['Healthlink_EDI'] = ''

    return row


def make_url(lat=None, lon=None, radius=None):
    base = 'https://uat.healthpointapi.com/baseR4/HealthcareService'
    if lat is None or lon is None:
        return args.url
    parts = []
    parts.append(f'latitude={lat}')
    parts.append(f'longitude={lon}')
    if radius is not None:
        parts.append(f'radius={radius}')
    return base + '?' + '&'.join(parts)


def run():
    target_rows = {}
    target_services = {}
    urls = []
    pages_fetched_by_anchor = {}
    total_duplicate_count = 0

    if args.grid:
        # NZ grid around main regions (sampling points). Add more for coverage if needed.
        anchors = [
            (-36.8485, 174.7633),   # Auckland
            (-41.2865, 174.7762),   # Wellington
            (-43.5321, 172.6362),   # Christchurch
            (-45.8742, 170.5036),   # Dunedin
            (-37.7870, 175.2793),   # Hamilton
            (-39.0612, 174.0752),   # Taupo
            (-38.6520, 176.0840),   # Rotorua
        ]
        for lat, lon in anchors:
            urls.append(make_url(lat, lon, args.radius))
    elif args.latitude is not None and args.longitude is not None:
        urls.append(make_url(args.latitude, args.longitude, args.radius))
    else:
        urls.append(args.url)

    log_file_handle = None
    if args.log:
        log_file_handle = open(args.log, 'a', encoding='utf-8')

    def log(message):
        if args.verbose:
            print(message)
        if log_file_handle is not None:
            log_file_handle.write(message + '\n')

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(max_retries=0)
    session.mount('https://', adapter)
    session.mount('http://', adapter)

    def fetch_resource(url):
        retries = 0
        while True:
            try:
                response = session.get(url, headers=headers, timeout=20)
                if response.status_code == 429:
                    if retries >= args.retry_count:
                        raise RuntimeError(f'HTTP 429 encountered too many times for {url}')
                    wait = args.retry_delay * (2 ** retries)
                    log(f'429 rate limit on {url}: backoff {wait:.1f}s ({retries + 1}/{args.retry_count})')
                    time.sleep(wait)
                    retries += 1
                    continue
                if response.status_code == 403:
                    log(f'403 forbidden for {url}, skipping')
                    return None
                response.raise_for_status()
                return response.json()
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
                if retries >= args.retry_count:
                    raise
                wait = args.retry_delay * (2 ** retries)
                log(f'Network issue on {url}: {exc}, retrying in {wait:.1f}s ({retries + 1}/{args.retry_count})')
                time.sleep(wait)
                retries += 1

    def get_practitioner_info(practitioner_ref):
        if not practitioner_ref:
            return {'practitioner_id': '', 'practitioner_name': ''}
        pid = str(practitioner_ref).split('/')[-1]
        if not pid:
            return {'practitioner_id': '', 'practitioner_name': ''}

        practitioner = fetch_resource(f'https://uat.healthpointapi.com/baseR4/Practitioner/{pid}')
        pr_name = ''
        if isinstance(practitioner, dict):
            if practitioner.get('name'):
                names = practitioner.get('name') or []
                if isinstance(names, list) and names:
                    n = names[0]
                    if isinstance(n, dict):
                        pr_name = n.get('text', '') or ' '.join(n.get('given', []) or []) + (' ' + n.get('family', '') if n.get('family') else '')
            if not pr_name:
                pr_name = practitioner.get('name', '')

        return {'practitioner_id': pid, 'practitioner_name': pr_name or ''}

    def get_practitioner_roles(practitioner_id):
        if not practitioner_id:
            return []
        search_url = f'https://uat.healthpointapi.com/baseR4/PractitionerRole?practitioner=Practitioner/{practitioner_id}&_count=100'
        data = fetch_resource(search_url)
        if not isinstance(data, dict) or data.get('resourceType') != 'Bundle':
            return []
        roles = []
        for entry in data.get('entry', []) or []:
            role = entry.get('resource') or {}
            if not isinstance(role, dict) or role.get('resourceType') != 'PractitionerRole':
                continue
            code = ''
            if role.get('code'):
                code = format_codeable_concept(role.get('code'))
            specialties = []
            for sp in role.get('specialty', []) or []:
                specialties.append(format_codeable_concept(sp))
            roles.append({'role_code': code, 'specialty': '; '.join([s for s in specialties if s])})
        return roles

    def expand_service_practitioner_rows(service):
        clinic = extract_clinic_fields(service)
        service_id = clinic.get('service_id')

        rows = []
        
        # 1. Fetch PractitionerRoles by service to get multiple practitioners
        if service_id:
            search_url = f'https://uat.healthpointapi.com/baseR4/PractitionerRole?service=HealthcareService/{service_id}&_count=100'
            data = fetch_resource(search_url)
            if isinstance(data, dict) and data.get('resourceType') == 'Bundle':
                for entry in data.get('entry', []) or []:
                    role = entry.get('resource') or {}
                    if not isinstance(role, dict) or role.get('resourceType') != 'PractitionerRole':
                        continue
                        
                    pref = ''
                    if isinstance(role.get('practitioner'), dict):
                        pref = role['practitioner'].get('reference', '')
                        
                    person = ''
                    ptitle = ''
                    for ext1 in role.get('extension', []) or []:
                        if not isinstance(ext1, dict):
                            continue
                        if ext1.get('url') == 'http://www.healthpoint.co.nz/':
                            for ext2 in ext1.get('extension', []) or []:
                                if not isinstance(ext2, dict):
                                    continue
                                if ext2.get('url') == 'person-name':
                                    person = ext2.get('valueString', '')
                                elif ext2.get('url') == 'service-title':
                                    ptitle = ext2.get('valueString', '')

                    rcode = ''
                    if role.get('code'):
                        rcode = format_codeable_concept(role.get('code'))
                    specialties = []
                    for sp in role.get('specialty', []) or []:
                        specialties.append(format_codeable_concept(sp))
                    rspecialty = '; '.join([s for s in specialties if s])
                    
                    pract_info = get_practitioner_info(pref)
                    pid = pract_info.get('practitioner_id', '')
                    pname = pract_info.get('practitioner_name', person or '')
                    
                    # Fallback for specialisation: specialty -> service-title -> rcode
                    final_specialisation = rspecialty or ptitle or rcode
                    
                    r = clinic.copy()
                    r.update({
                        'practitioner_id': pid,
                        'practitioner_name': pname,
                        'practitioner_type': rcode,
                        'specialisation': final_specialisation,
                        'practitioner_role': rcode,
                    })
                    rows.append(r)

        # 2. Add fallback for people-list if PractitionerRole fetch didn't yield anything
        # (Just to be safe and ensure backward compatibility)
        if not rows:
            people_list = find_extensions(service, 'people-list')
            for people_ext in people_list:
                person = ''
                ptype = ''
                ptitle = ''
                pref = ''
                for pext in people_ext.get('extension', []) or []:
                    if not isinstance(pext, dict):
                        continue
                    if pext.get('url') == 'person':
                        ref_obj = pext.get('valueReference', {})
                        if isinstance(ref_obj, dict):
                            pref = ref_obj.get('reference', '')
                            person = ref_obj.get('display', '')
                    elif pext.get('url') == 'person-type':
                        ptype = pext.get('valueString', '')
                    elif pext.get('url') == 'person-title':
                        ptitle = pext.get('valueString', '')

                pract_info = get_practitioner_info(pref)
                pid = pract_info.get('practitioner_id', '')
                pname = pract_info.get('practitioner_name', person or '')
                role_entries = get_practitioner_roles(pid)

                if role_entries:
                    for re in role_entries:
                        r = clinic.copy()
                        r.update({
                            'practitioner_id': pid,
                            'practitioner_name': pname,
                            'practitioner_type': ptype,
                            'specialisation': re.get('specialty', '') or ptitle or ptype,
                            'practitioner_role': re.get('role_code', ''),
                        })
                        rows.append(r)
                else:
                    r = clinic.copy()
                    r.update({
                        'practitioner_id': pid,
                        'practitioner_name': pname,
                        'practitioner_type': ptype,
                        'specialisation': ptitle or ptype,
                        'practitioner_role': '',
                    })
                    rows.append(r)

        if not rows:
            r = clinic.copy()
            r.update({
                'practitioner_id': '',
                'practitioner_name': '',
                'practitioner_type': '',
                'specialisation': '',
                'practitioner_role': '',
            })
            rows.append(r)

        return rows

    def fetch_bundle_entries(url):
        entries = []
        next_url = url
        pages = 0

        while next_url:
            if pages >= args.max_pages:
                log(f'WARN: max-pages reached ({args.max_pages}) for anchor {url}; truncating pagination.')
                break

            log(f'Fetching bundle page: {next_url}')
            retries = 0
            while True:
                try:
                    response = session.get(next_url, headers=headers, timeout=20)
                    if response.status_code == 429:
                        if retries >= args.retry_count:
                            raise RuntimeError(f'HTTP 429 encountered too many times for {next_url}')
                        wait = args.retry_delay * (2 ** retries)
                        log(f'429 rate limit: backoff {wait:.1f}s (retry {retries + 1}/{args.retry_count})')
                        time.sleep(wait)
                        retries += 1
                        continue

                    response.raise_for_status()
                    break
                except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
                    if retries >= args.retry_count:
                        raise
                    wait = args.retry_delay * (2 ** retries)
                    log(f'Network issue: {exc}, retrying in {wait:.1f}s ({retries + 1}/{args.retry_count})')
                    time.sleep(wait)
                    retries += 1

            content_type = response.headers.get('Content-Type', '').lower()
            if 'xml' in content_type or '_format=xml' in next_url.lower():
                raise RuntimeError('XML payload is not supported with this focused CSV exporter.')

            bundle = response.json()
            if isinstance(bundle, dict) and bundle.get('resourceType') == 'Bundle':
                entries.extend(bundle.get('entry', []))
                next_url = None
                for link in bundle.get('link', []) or []:
                    if link.get('relation') == 'next' and link.get('url'):
                        next_url = link['url']
                        break
            else:
                if isinstance(bundle, dict) and bundle.get('resourceType') == 'HealthcareService':
                    entries.append({'resource': bundle})
                elif isinstance(bundle, list):
                    for item in bundle:
                        entries.append({'resource': item})
                next_url = None

            pages += 1

        return entries, pages

    if args.service_id:
        service_url = f'https://uat.healthpointapi.com/baseR4/HealthcareService/_search?_id={args.service_id}&_format=json'
        entries, pages = fetch_bundle_entries(service_url)
        pages_fetched_by_anchor[service_url] = pages

        practitioner_rows = []
        for entry in entries:
            service = entry.get('resource') if isinstance(entry, dict) else None
            if not service or service.get('resourceType') != 'HealthcareService':
                continue
            practitioner_rows.extend(expand_service_practitioner_rows(service))

        practitioner_fieldnames = [
            'service_id', 'service_name', 'region', 'city', 'latitude', 'longitude',
            'phone', 'email', 'wheelchair_access', 'Healthlink_EDI',
            'practitioner_id', 'practitioner_name', 'practitioner_type',
            'specialisation', 'practitioner_role'
        ]

        deduped_rows = []
        seen = set()
        for row in practitioner_rows:
            key = tuple(flatten_value(row.get(k, '')) for k in practitioner_fieldnames)
            if key in seen:
                continue
            seen.add(key)
            deduped_rows.append(row)

        with open(args.output_practitioners, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=practitioner_fieldnames)
            writer.writeheader()
            for row in deduped_rows:
                writer.writerow({k: flatten_value(row.get(k, '')) for k in practitioner_fieldnames})

        msg = f'Saved {len(deduped_rows)} unique rows (deduped {len(practitioner_rows)-len(deduped_rows)}) to {args.output_practitioners}. Anchor pages fetched: {pages}.'
        print(msg)
        log(msg)
        if log_file_handle is not None:
            log_file_handle.close()
        return

    for u in urls:
        entries, pages = fetch_bundle_entries(u)
        pages_fetched_by_anchor[u] = pages

        for entry in entries:
            service = entry.get('resource') if isinstance(entry, dict) else None
            if not service or service.get('resourceType') != 'HealthcareService':
                continue

            sid = service.get('id') or ''
            if not sid:
                continue
            if sid in target_rows:
                total_duplicate_count += 1
                continue

            target_rows[sid] = extract_field(service)
            target_services[sid] = service

    if not target_rows:
        log('No HealthcareService resources found.')
        if log_file_handle is not None:
            log_file_handle.close()
        return

    fieldnames = [
        'service_id', 'service_name', 'region', 'city', 'latitude', 'longitude',
        'phone', 'email', 'wheelchair_access',
        'practitioner_name', 'practitioner_type', 'practitioner_title',
        'Healthlink_EDI'
    ]

    if args.per_practitioner:
        output_rows = []
        for sid, service in target_services.items():
            output_rows.extend(extract_practitioner_rows(service))
        row_count = len(output_rows)
    else:
        output_rows = list(target_rows.values())
        row_count = len(output_rows)

    with open(args.output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in output_rows:
            writer.writerow({k: flatten_value(row.get(k, '')) for k in fieldnames})

    summary_msg = (
        f'Saved {row_count} rows to {args.output}. '
        f'Source clinics: {len(target_rows)} unique HealthcareService records. '
        f'Total duplicate service IDs skipped: {total_duplicate_count}. '
        f'Anchor pages fetched: {sum(pages_fetched_by_anchor.values())}.'
    )
    print(summary_msg)
    log(summary_msg)

    for anchor, pages in pages_fetched_by_anchor.items():
        log(f'Anchor {anchor} fetched {pages} pages')

    if log_file_handle is not None:
        log_file_handle.close()


if __name__ == '__main__':
    try:
        run()
    except Exception as exc:
        print(f'Error: {exc}')
