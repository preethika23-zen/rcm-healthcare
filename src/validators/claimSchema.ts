import { z } from 'zod';
import { validateNPI, validateCPTCode, validateICD10Code, validatePlaceOfService } from '../utils/security';


const npiSchema = z.string()
  .length(10, 'NPI must be exactly 10 digits')
  .regex(/^\d{10}$/, 'NPI must contain only digits')
  .refine(validateNPI, 'Invalid NPI checksum');


const cptCodeSchema = z.string()
  .min(5, 'CPT code must be at least 5 characters')
  .max(8, 'CPT code must be at most 8 characters')
  .refine(validateCPTCode, 'Invalid CPT code format');


const icd10CodeSchema = z.string()
  .min(3, 'ICD-10 code must be at least 3 characters')
  .max(8, 'ICD-10 code must be at most 8 characters')
  .refine(validateICD10Code, 'Invalid ICD-10 code format');


const placeOfServiceSchema = z.string()
  .length(2, 'Place of service must be exactly 2 digits')
  .refine(validatePlaceOfService, 'Invalid place of service code');


const patientNameSchema = z.string()
  .min(1, 'Patient name is required')
  .max(200, 'Patient name must be at most 200 characters')
  .regex(/^[a-zA-Z\s\-'.,]+$/, 'Patient name contains invalid characters')
  .transform(val => val.trim());


const patientIdSchema = z.string()
  .min(1, 'Patient ID is required')
  .max(50, 'Patient ID must be at most 50 characters')
  .regex(/^[a-zA-Z0-9\-]+$/, 'Patient ID contains invalid characters');


const payerNameSchema = z.string()
  .min(1, 'Payer name is required')
  .max(200, 'Payer name must be at most 200 characters')
  .transform(val => val.trim());


const billedAmountSchema = z.number()
  .positive('Billed amount must be positive')
  .max(10000000, 'Billed amount exceeds maximum limit')
  .refine(val => Number.isFinite(val), 'Billed amount must be a valid number');


const patientAgeSchema = z.number()
  .int('Age must be a whole number')
  .min(0, 'Age must be at least 0')
  .max(120, 'Age must be at most 120');


export const claimSchema = z.object({
  patientName: patientNameSchema,
  patientId: patientIdSchema,
  payerName: payerNameSchema,
  cptCode: cptCodeSchema,
  icd10Codes: z.array(icd10CodeSchema)
    .min(1, 'At least one ICD-10 code is required')
    .max(25, 'Maximum 25 ICD-10 codes allowed'),
  billedAmount: billedAmountSchema,
  patientAge: patientAgeSchema,
  providerNpi: npiSchema,
  placeOfService: placeOfServiceSchema,
  priorAuthObtained: z.boolean(),
  insuranceActive: z.boolean(),
  documentationComplete: z.boolean()
}).strict(); 


export const partialClaimSchema = claimSchema.partial();


export const batchClaimSchema = z.array(claimSchema)
  .min(1, 'At least one claim is required')
  .max(1000, 'Maximum 1000 claims per batch');


export const rawClaimDataSchema = z.object({
  patientName: z.string().optional(),
  patient_name: z.string().optional(),
  PatientName: z.string().optional(),
  'Patient Name': z.string().optional(),
  
  patientId: z.string().optional(),
  patient_id: z.string().optional(),
  PatientId: z.string().optional(),
  'Patient ID': z.string().optional(),
  
  payerName: z.string().optional(),
  payer_name: z.string().optional(),
  PayerName: z.string().optional(),
  'Payer Name': z.string().optional(),
  payer: z.string().optional(),
  insurance: z.string().optional(),
  
  cptCode: z.string().optional(),
  cpt_code: z.string().optional(),
  CPTCode: z.string().optional(),
  'CPT Code': z.string().optional(),
  cpt: z.string().optional(),
  
  icd10Codes: z.union([z.string(), z.array(z.string())]).optional(),
  icd10_codes: z.union([z.string(), z.array(z.string())]).optional(),
  ICD10Codes: z.union([z.string(), z.array(z.string())]).optional(),
  'ICD-10 Codes': z.union([z.string(), z.array(z.string())]).optional(),
  icd10: z.union([z.string(), z.array(z.string())]).optional(),
  diagnosis: z.union([z.string(), z.array(z.string())]).optional(),
  
  billedAmount: z.union([z.string(), z.number()]).optional(),
  billed_amount: z.union([z.string(), z.number()]).optional(),
  BilledAmount: z.union([z.string(), z.number()]).optional(),
  'Billed Amount': z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  
  patientAge: z.union([z.string(), z.number()]).optional(),
  patient_age: z.union([z.string(), z.number()]).optional(),
  PatientAge: z.union([z.string(), z.number()]).optional(),
  'Patient Age': z.union([z.string(), z.number()]).optional(),
  age: z.union([z.string(), z.number()]).optional(),
  
  providerNpi: z.string().optional(),
  provider_npi: z.string().optional(),
  ProviderNpi: z.string().optional(),
  'Provider NPI': z.string().optional(),
  npi: z.string().optional(),
  
  placeOfService: z.string().optional(),
  place_of_service: z.string().optional(),
  PlaceOfService: z.string().optional(),
  'Place of Service': z.string().optional(),
  pos: z.string().optional(),
  
  priorAuthObtained: z.union([z.string(), z.boolean()]).optional(),
  prior_auth_obtained: z.union([z.string(), z.boolean()]).optional(),
  PriorAuthObtained: z.union([z.string(), z.boolean()]).optional(),
  'Prior Authorization': z.union([z.string(), z.boolean()]).optional(),
  priorAuth: z.union([z.string(), z.boolean()]).optional(),
  
  insuranceActive: z.union([z.string(), z.boolean()]).optional(),
  insurance_active: z.union([z.string(), z.boolean()]).optional(),
  InsuranceActive: z.union([z.string(), z.boolean()]).optional(),
  'Coverage Status': z.union([z.string(), z.boolean()]).optional(),
  active: z.union([z.string(), z.boolean()]).optional(),
  
  documentationComplete: z.union([z.string(), z.boolean()]).optional(),
  documentation_complete: z.union([z.string(), z.boolean()]).optional(),
  DocumentationComplete: z.union([z.string(), z.boolean()]).optional(),
  'Documentation': z.union([z.string(), z.boolean()]).optional(),
  docsComplete: z.union([z.string(), z.boolean()]).optional()
}).passthrough();


export interface ValidationResult {
  success: boolean;
  data?: z.infer<typeof claimSchema>;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export function validateClaim(data: unknown): ValidationResult {
  try {
    const result = claimSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: []
      };
    }
    
    const zodErrors = result.error.issues || [];
    return {
      success: false,
      errors: zodErrors.map((err) => ({
        field: String(err.path.join('.')),
        message: err.message
      }))
    };
  } catch {
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed unexpectedly' }]
    };
  }
}

export function validateBatchClaims(data: unknown[]): {
  validClaims: z.infer<typeof claimSchema>[];
  invalidClaims: Array<{ index: number; errors: Array<{ field: string; message: string }> }>;
} {
  const validClaims: z.infer<typeof claimSchema>[] = [];
  const invalidClaims: Array<{ index: number; errors: Array<{ field: string; message: string }> }> = [];
  
  data.forEach((claim, index) => {
    const result = validateClaim(claim);
    if (result.success && result.data) {
      validClaims.push(result.data);
    } else {
      invalidClaims.push({ index, errors: result.errors });
    }
  });
  
  return { validClaims, invalidClaims };
}


export type ClaimInput = z.infer<typeof claimSchema>;
export type RawClaimData = z.infer<typeof rawClaimDataSchema>;
