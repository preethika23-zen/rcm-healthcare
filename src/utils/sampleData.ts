import type { ClaimData } from '../types/claim';
import { PAYER_NAMES, COMMON_CPT_CODES, COMMON_ICD10_CODES } from '../types/claim';

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson'
];

const PLACE_OF_SERVICE = ['11', '21', '22', '23', '24', '31', '81'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePatientId(): string {
  const prefix = ['P', 'PT', 'MRN'][Math.floor(Math.random() * 3)];
  const number = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${number}`;
}

function generateNPI(): string {
  let npi = '1';
  for (let i = 0; i < 9; i++) {
    npi += Math.floor(Math.random() * 10);
  }
  return npi;
}

function generateICD10Codes(): string[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const codes: string[] = [];

  while (codes.length < count) {
    const code = randomItem(COMMON_ICD10_CODES);
    if (!codes.includes(code)) {
      codes.push(code);
    }
  }

  return codes;
}

export function generateSampleClaim(
  options?: { riskLevel?: 'low' | 'medium' | 'high' }
): ClaimData {
  const riskLevel = options?.riskLevel || randomItem(['low', 'medium', 'high'] as const);

  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);

  const claim: ClaimData = {
    patientName: `${firstName} ${lastName}`,
    patientId: generatePatientId(),
    payerName: randomItem(PAYER_NAMES),
    cptCode: randomItem(COMMON_CPT_CODES),
    icd10Codes: generateICD10Codes(),
    billedAmount: Math.floor(Math.random() * 15000) + 5000,
    patientAge: Math.floor(Math.random() * 80) + 18,
    providerNpi: generateNPI(),
    placeOfService: randomItem(PLACE_OF_SERVICE),

    priorAuthObtained: true,
    insuranceActive: true,
    documentationComplete: true,

    dischargeSummary: true,
    investigationReports: true,
    billBreakup: true,
    prescriptionAttached: true,
    networkHospital: true
  };

  if (riskLevel === 'high') {
    claim.insuranceActive = false;
    claim.priorAuthObtained = false;
    claim.documentationComplete = false;
    claim.dischargeSummary = false;
    claim.investigationReports = false;
    claim.billBreakup = false;
    claim.prescriptionAttached = false;
    claim.networkHospital = false;
    claim.providerNpi = '12345';
  } else if (riskLevel === 'medium') {
    claim.priorAuthObtained = Math.random() > 0.5;
    claim.documentationComplete = Math.random() > 0.5;
    claim.dischargeSummary = Math.random() > 0.3;
    claim.investigationReports = Math.random() > 0.3;
    claim.billBreakup = Math.random() > 0.3;
    claim.prescriptionAttached = Math.random() > 0.3;
    claim.networkHospital = Math.random() > 0.3;
  }

  return claim;
}

export function generateSampleBatch(count: number = 10): ClaimData[] {
  const claims: ClaimData[] = [];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    const riskLevel = rand < 0.6 ? 'low' : rand < 0.85 ? 'medium' : 'high';
    claims.push(generateSampleClaim({ riskLevel }));
  }

  return claims;
}