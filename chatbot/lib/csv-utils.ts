import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface PractitionerRecord {
  service_id: string;
  service_name: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  wheelchair_access: string;
  Healthlink_EDI: string;
  practitioner_id: string;
  practitioner_name: string;
  practitioner_type: string;
  specialisation: string;
  practitioner_role: string;
}

export const getPractitionerData = async (): Promise<PractitionerRecord[]> => {
  const csvFilePath = path.join(process.cwd(), 'data/service_practitioners.csv');
  const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvFileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as PractitionerRecord[]);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

export const searchPractitioners = async (query: string) => {
  const data = await getPractitionerData();
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  
  if (keywords.length === 0) return [];

  const results = data.filter(item => {
    const searchString = Object.values(item).join(' ').toLowerCase();
    return keywords.some(keyword => searchString.includes(keyword));
  });

  // Clean up and limit results to avoid token bloat
  return results.slice(0, 10).map(p => ({
    name: p.practitioner_name || 'N/A',
    role: p.practitioner_role || p.practitioner_type || 'Practitioner',
    specialisation: p.specialisation || 'General',
    service: p.service_name,
    city: p.city,
    region: p.region,
    phone: p.phone,
    email: p.email,
    wheelchair: p.wheelchair_access === 'yes' ? 'Available' : 'Not specified'
  }));
};

export const searchPractitionersByService = async (serviceName: string) => {
  const data = await getPractitionerData();
  const results = data.filter(item => 
    item.service_name.toLowerCase().includes(serviceName.toLowerCase())
  );
  
  return results.map(p => ({
    name: p.practitioner_name,
    role: p.practitioner_role || p.practitioner_type || 'N/A',
    specialisation: p.specialisation,
    service: p.service_name,
    phone: p.phone,
    email: p.email,
    city: p.city
  }));
};
