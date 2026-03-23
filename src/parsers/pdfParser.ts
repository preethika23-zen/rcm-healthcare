
import type { ClaimData, FileUploadResult } from '../types/claim';
import { sanitizeString, sanitizeNumber, sanitizeFileName, validateFileType, checkRateLimit, getClientIdentifier } from '../utils/security';
import { fillDefaultValues } from '../utils/fieldMapper';


const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EXTRACTION_PATTERNS: Record<string, RegExp[]> = {
  patientName: [
    /Patient\s*Name\s*[:\-]?\s*([A-Za-z\s\-']+?)(?:\n|$|Patient)/i,
    /Name\s*[:\-]?\s*([A-Za-z\s\-']+?)(?:\n|$)/i,
    /Member\s*Name\s*[:\-]?\s*([A-Za-z\s\-']+?)(?:\n|$)/i
  ],
  patientId: [
    /Patient\s*(?:ID|Number)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    /Member\s*(?:ID|Number)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    /Account\s*(?:Number|#)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
    /MRN\s*[:\-]?\s*([A-Z0-9\-]+)/i
  ],
  payerName: [
    /Payer\s*(?:Name)?\s*[:\-]?\s*([A-Za-z\s\-']+?)(?:\n|$)/i,
    /Insurance\s*(?:Name|Company)?\s*[:\-]?\s*([A-Za-z\s\-']+?)(?:\n|$)/i,
    /Carrier\s*[:\-]?\s*([A-Za-z\s\-']+?)(?:\n|$)/i
  ],
  cptCode: [
    /CPT\s*(?:Code)?\s*[:\-]?\s*(\d{5}(?:-\d{2})?)/i,
    /Procedure\s*Code\s*[:\-]?\s*(\d{5}(?:-\d{2})?)/i,
    /HCPCS\s*[:\-]?\s*(\d{5})/i
  ],
  icd10Codes: [
    /ICD-?10\s*(?:Codes?)?\s*[:\-]?\s*([A-Z]\d{2}(?:\.\d{1,4})?(?:[,;\s]+[A-Z]\d{2}(?:\.\d{1,4})?)*)/gi,
    /Diagnosis\s*(?:Codes?)?\s*[:\-]?\s*([A-Z]\d{2}(?:\.\d{1,4})?(?:[,;\s]+[A-Z]\d{2}(?:\.\d{1,4})?)*)/gi,
    /DX\s*[:\-]?\s*([A-Z]\d{2}(?:\.\d{1,4})?(?:[,;\s]+[A-Z]\d{2}(?:\.\d{1,4})?)*)/gi
  ],
  billedAmount: [
    /Billed\s*Amount\s*[:\-]?\s*\$?([\d,]+\.?\d*)/i,
    /Total\s*(?:Charge|Amount)\s*[:\-]?\s*\$?([\d,]+\.?\d*)/i,
    /Charges?\s*[:\-]?\s*\$?([\d,]+\.?\d*)/i,
    /Amount\s*[:\-]?\s*\$?([\d,]+\.?\d*)/i
  ],
  patientAge: [
    /(?:Patient\s*)?Age\s*[:\-]?\s*(\d{1,3})/i,
    /(\d{1,3})\s*(?:years?\s*old|y\.?o\.?)/i,
    /DOB.*?(\d{1,3})\s*years?/i
  ],
  providerNpi: [
    /(?:Provider\s*)?NPI\s*[:\-]?\s*(\d{10})/i,
    /National\s*Provider\s*(?:Identifier|ID)\s*[:\-]?\s*(\d{10})/i,
    /Billing\s*NPI\s*[:\-]?\s*(\d{10})/i
  ],
  placeOfService: [
    /Place\s*of\s*Service\s*[:\-]?\s*(\d{2})/i,
    /POS\s*[:\-]?\s*(\d{2})/i,
    /Service\s*Location\s*[:\-]?\s*(\d{2})/i
  ],
  priorAuth: [
    /Prior\s*Auth(?:orization)?\s*[:\-]?\s*(Yes|No|Obtained|Required|N\/A)/i,
    /Pre-?(?:cert|authorization)\s*[:\-]?\s*(Yes|No|Obtained|Required|N\/A)/i,
    /Authorization\s*[:\-]?\s*(Yes|No|Obtained|Required)/i
  ],
  insuranceActive: [
    /(?:Insurance|Coverage)\s*(?:Status|Active)?\s*[:\-]?\s*(Active|Inactive|Yes|No|Valid|Invalid)/i,
    /Eligibility\s*[:\-]?\s*(Active|Inactive|Eligible|Ineligible|Yes|No)/i,
    /Coverage\s*[:\-]?\s*(Active|Inactive|Yes|No)/i
  ],
  documentationComplete: [
    /Documentation\s*(?:Complete|Status)?\s*[:\-]?\s*(Complete|Incomplete|Yes|No|Attached)/i,
    /Supporting\s*Docs?\s*[:\-]?\s*(Complete|Incomplete|Yes|No|Attached)/i
  ]
};


async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        

        let text = '';
        let inTextBlock = false;
        let buffer = '';
        
        for (let i = 0; i < uint8Array.length; i++) {
          const char = String.fromCharCode(uint8Array[i]);
          buffer += char;
          

          if (buffer.includes('BT')) {
            inTextBlock = true;
            buffer = '';
          } else if (buffer.includes('ET') && inTextBlock) {
            inTextBlock = false;
            buffer = '';
          }
          

          if (inTextBlock) {
            if (buffer.match(/\(([^)]*)\)\s*Tj/)) {
              const match = buffer.match(/\(([^)]*)\)\s*Tj/);
              if (match) {
                text += match[1] + ' ';
              }
              buffer = '';
            }
          }
          

          if (buffer.length > 1000) {
            buffer = buffer.slice(-100);
          }
        }
        

        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const fullText = textDecoder.decode(uint8Array);
        
  
        const readablePattern = /[\x20-\x7E]{5,}/g;
        const readableMatches = fullText.match(readablePattern);
        if (readableMatches) {
          text += ' ' + readableMatches.join(' ');
        }
        
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}


function parseTextBoolean(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return ['yes', 'true', 'obtained', 'active', 'valid', 'eligible', 'complete', 'attached'].includes(lower);
}


function extractClaimFromText(text: string): Partial<ClaimData> {
  const claim: Partial<ClaimData> = {};
  

  for (const pattern of EXTRACTION_PATTERNS.patientName) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.patientName = sanitizeString(match[1].trim(), 200);
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.patientId) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.patientId = sanitizeString(match[1].trim(), 50);
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.payerName) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.payerName = sanitizeString(match[1].trim(), 200);
      break;
    }
  }
  
  for (const pattern of EXTRACTION_PATTERNS.cptCode) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.cptCode = sanitizeString(match[1].trim(), 10);
      break;
    }
  }
  
  
  for (const pattern of EXTRACTION_PATTERNS.icd10Codes) {
    const matches = text.matchAll(pattern);
    const codes: string[] = [];
    for (const match of matches) {
      if (match[1]) {
        const extracted = match[1].split(/[,;\s]+/).filter(Boolean);
        codes.push(...extracted.map(c => sanitizeString(c.trim(), 10)));
      }
    }
    if (codes.length > 0) {
      claim.icd10Codes = [...new Set(codes)].slice(0, 25);
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.billedAmount) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = sanitizeNumber(parseFloat(match[1].replace(/,/g, '')), 0, 10000000);
      if (amount !== null) {
        claim.billedAmount = amount;
        break;
      }
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.patientAge) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const age = sanitizeNumber(parseInt(match[1]), 0, 120);
      if (age !== null) {
        claim.patientAge = age;
        break;
      }
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.providerNpi) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.providerNpi = match[1];
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.placeOfService) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.placeOfService = match[1].padStart(2, '0');
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.priorAuth) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.priorAuthObtained = parseTextBoolean(match[1]);
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.insuranceActive) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.insuranceActive = parseTextBoolean(match[1]);
      break;
    }
  }
  

  for (const pattern of EXTRACTION_PATTERNS.documentationComplete) {
    const match = text.match(pattern);
    if (match && match[1]) {
      claim.documentationComplete = parseTextBoolean(match[1]);
      break;
    }
  }
  
  return claim;
}


export async function parsePDF(file: File): Promise<FileUploadResult> {

  const rateCheck = checkRateLimit(getClientIdentifier(), 'FILE_UPLOAD');
  if (!rateCheck.allowed) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'pdf',
      recordCount: 0,
      claims: [],
      errors: [`Rate limit exceeded. Please try again in ${Math.ceil((rateCheck.resetTime - Date.now()) / 1000)} seconds.`]
    };
  }


  const fileValidation = validateFileType(file, ['pdf']);
  if (!fileValidation.valid) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'pdf',
      recordCount: 0,
      claims: [],
      errors: [fileValidation.error || 'Invalid file type']
    };
  }


  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'pdf',
      recordCount: 0,
      claims: [],
      errors: ['File size exceeds 10MB limit']
    };
  }

  try {
    const text = await extractTextFromPDF(file);
    
    if (!text || text.length < 10) {
      return {
        success: false,
        fileName: sanitizeFileName(file.name),
        fileType: 'pdf',
        recordCount: 0,
        claims: [],
        errors: ['Could not extract text from PDF. The PDF may be scanned or image-based.']
      };
    }

    const extractedClaim = extractClaimFromText(text);
    const errors: string[] = [];
    
  
    const extractedFields = Object.keys(extractedClaim).filter(k => 
      extractedClaim[k as keyof typeof extractedClaim] !== undefined
    );
    
    if (extractedFields.length < 3) {
      errors.push('Limited data extracted from PDF. Please verify the extracted information.');
    }

    const claim = fillDefaultValues(extractedClaim);

    return {
      success: true,
      fileName: sanitizeFileName(file.name),
      fileType: 'pdf',
      recordCount: 1,
      claims: [claim],
      errors
    };

  } catch (error) {
    return {
      success: false,
      fileName: sanitizeFileName(file.name),
      fileType: 'pdf',
      recordCount: 0,
      claims: [],
      errors: ['Failed to parse PDF: ' + (error instanceof Error ? error.message : 'Unknown error')]
    };
  }
}
