
import * as XLSX from 'xlsx';
import type { ClaimData, FileUploadResult } from '../types/claim';
import { mapRowToClaim, hasMinimumFields, fillDefaultValues } from '../utils/fieldMapper';
import { sanitizeFileName, validateFileType, checkRateLimit, getClientIdentifier } from '../utils/security';


const MAX_RECORDS = 1000;

const MAX_FILE_SIZE = 10 * 1024 * 1024;


export async function parseExcelOrCSV(file: File): Promise<FileUploadResult> {

  const rateCheck = checkRateLimit(getClientIdentifier(), 'FILE_UPLOAD');
  if (!rateCheck.allowed) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'csv',
      recordCount: 0,
      claims: [],
      errors: [`Rate limit exceeded. Please try again in ${Math.ceil((rateCheck.resetTime - Date.now()) / 1000)} seconds.`]
    };
  }


  const fileValidation = validateFileType(file, ['xlsx', 'xls', 'csv']);
  if (!fileValidation.valid) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'csv',
      recordCount: 0,
      claims: [],
      errors: [fileValidation.error || 'Invalid file type']
    };
  }


  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'csv',
      recordCount: 0,
      claims: [],
      errors: ['File size exceeds 10MB limit']
    };
  }

  const fileType = file.name.endsWith('.csv') ? 'csv' : 'excel';

  try {
    const arrayBuffer = await file.arrayBuffer();
    

    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });


    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        fileName: sanitizeFileName(file.name),
        fileType,
        recordCount: 0,
        claims: [],
        errors: ['No sheets found in the file']
      };
    }

    const sheet = workbook.Sheets[sheetName];
    
   
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: ''
    });

    if (rawData.length === 0) {
      return {
        success: false,
        fileName: sanitizeFileName(file.name),
        fileType,
        recordCount: 0,
        claims: [],
        errors: ['No data found in the file']
      };
    }


    const recordsToProcess = rawData.slice(0, MAX_RECORDS);
    const claims: Partial<ClaimData>[] = [];
    const errors: string[] = [];

    if (rawData.length > MAX_RECORDS) {
      errors.push(`File contains ${rawData.length} records. Only the first ${MAX_RECORDS} will be processed.`);
    }


    for (let i = 0; i < recordsToProcess.length; i++) {
      try {
        const row = recordsToProcess[i];
        const mappedClaim = mapRowToClaim(row);
        
        if (hasMinimumFields(mappedClaim)) {
          claims.push(fillDefaultValues(mappedClaim));
        } else {
          errors.push(`Row ${i + 2}: Missing required fields (patient name, ID, payer, or codes)`);
        }
      } catch (err) {
        errors.push(`Row ${i + 2}: Failed to parse row`);
      }
    }

    return {
      success: claims.length > 0,
      fileName: sanitizeFileName(file.name),
      fileType,
      recordCount: claims.length,
      claims,
      errors
    };

  } catch (error) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType,
      recordCount: 0,
      claims: [],
      errors: ['Failed to parse file: ' + (error instanceof Error ? error.message : 'Unknown error')]
    };
  }
}


export function generateSampleTemplate(): Blob {
  const sampleData = [
    {
      'Patient Name': 'John Smith',
      'Patient ID': 'P001234',
      'Payer Name': 'Blue Cross Blue Shield',
      'CPT Code': '99213',
      'ICD-10 Codes': 'E11.9, I10',
      'Billed Amount': '$150.00',
      'Patient Age': 45,
      'Provider NPI': '1234567890',
      'Place of Service': '11',
      'Prior Authorization': 'Yes',
      'Insurance Active': 'Yes',
      'Documentation Complete': 'Yes'
    },
    {
      'Patient Name': 'Jane Doe',
      'Patient ID': 'P001235',
      'Payer Name': 'Aetna',
      'CPT Code': '99214',
      'ICD-10 Codes': 'J06.9',
      'Billed Amount': '$200.00',
      'Patient Age': 32,
      'Provider NPI': '1234567890',
      'Place of Service': '11',
      'Prior Authorization': 'No',
      'Insurance Active': 'Yes',
      'Documentation Complete': 'Yes'
    }
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  
  worksheet['!cols'] = [
    { wch: 20 }, 
    { wch: 12 }, 
    { wch: 25 }, 
    { wch: 10 }, 
    { wch: 15 }, 
    { wch: 12 }, 
    { wch: 12 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 18 }, 
    { wch: 16 }, 
    { wch: 22 }  
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Claims');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
