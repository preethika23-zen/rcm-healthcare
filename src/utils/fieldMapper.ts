
import type { ClaimData } from '../types/claim';
import { sanitizeString, sanitizeNumber } from './security';

const FIELD_MAPPINGS: Record<keyof ClaimData, string[]> = {
  patientName: [
    'patientname', 'patient_name', 'patient name', 'name', 'patient',
    'fullname', 'full_name', 'full name', 'membername', 'member_name'
  ],
  patientId: [
    'patientid', 'patient_id', 'patient id', 'id', 'memberid', 'member_id',
    'member id', 'accountnumber', 'account_number', 'account number', 'mrn'
  ],
  payerName: [
    'payername', 'payer_name', 'payer name', 'payer', 'insurance',
    'insurancename', 'insurance_name', 'insurance name', 'carrier',
    'insurer', 'plan', 'planname', 'plan_name'
  ],
  cptCode: [
    'cptcode', 'cpt_code', 'cpt code', 'cpt', 'procedurecode',
    'procedure_code', 'procedure code', 'hcpcs', 'hcpcscode'
  ],
  icd10Codes: [
    'icd10codes', 'icd10_codes', 'icd10 codes', 'icd-10 codes', 'icd10', 'icd-10',
    'diagnosiscode', 'diagnosis_code', 'diagnosis code', 'diagnosis',
    'dx', 'dxcode', 'dx_code', 'icdcodes', 'icd_codes'
  ],
  billedAmount: [
    'billedamount', 'billed_amount', 'billed amount', 'amount', 'charge',
    'totalcharge', 'total_charge', 'total charge', 'charges', 'fee',
    'billedcharge', 'billed_charge', 'unitprice', 'price'
  ],
  patientAge: [
    'patientage', 'patient_age', 'patient age', 'age', 'memberage',
    'member_age', 'years', 'yearsold'
  ],
  providerNpi: [
    'providernpi', 'provider_npi', 'provider npi', 'npi', 'nationalprovideridentifier',
    'billingnpi', 'billing_npi', 'renderingnpi', 'rendering_npi'
  ],
  placeOfService: [
    'placeofservice', 'place_of_service', 'place of service', 'pos',
    'servicelocation', 'service_location', 'location', 'facility'
  ],
  priorAuthObtained: [
    'priorauthobtained', 'prior_auth_obtained', 'prior authorization',
    'priorauth', 'prior_auth', 'authorization', 'auth', 'authorizationobtained',
    'preauth', 'precertification', 'precert'
  ],
  insuranceActive: [
    'insuranceactive', 'insurance_active', 'coverage status', 'active',
    'coverageactive', 'coverage_active', 'eligibility', 'eligible',
    'insuranceeligible', 'covered', 'iscovered'
  ],
  documentationComplete: [
    'documentationcomplete', 'documentation_complete', 'documentation',
    'docscomplete', 'docs_complete', 'complete', 'documentationattached',
    'documentation_attached', 'supporting_docs', 'supportingdocs'
  ],
  dischargeSummary: [
    'dischargesummary', 'discharge_summary', 'discharge summary',
    'dischargesumm', 'discharge note', 'discharge notes'
  ],
  investigationReports: [
    'investigationreports', 'investigation_reports', 'investigation reports',
    'labreports', 'lab_reports', 'lab reports', 'diagnosticreports',
    'diagnostic_reports', 'testreports', 'test_reports'
  ],
  billBreakup: [
    'billbreakup', 'bill_breakup', 'bill breakup', 'itemizedbill',
    'itemized_bill', 'billdetails', 'bill_details', 'chargebreakup',
    'charge_breakup'
  ],
  prescriptionAttached: [
    'prescriptionattached', 'prescription_attached', 'prescription attached',
    'prescription', 'rxattached', 'rx_attached', 'doctorprescription',
    'doctor_prescription'
  ],
  networkHospital: [
    'networkhospital', 'network_hospital', 'network hospital',
    'innetwork', 'in_network', 'hospitalnetwork', 'hospital_network',
    'empanelledhospital', 'empanelled_hospital'
  ]
};

function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function mapColumnToField(columnName: string): keyof ClaimData | null {
  const normalized = normalizeFieldName(columnName);

  for (const [field, variations] of Object.entries(FIELD_MAPPINGS)) {
    if (variations.some((variation) => normalizeFieldName(variation) === normalized)) {
      return field as keyof ClaimData;
    }
  }

  return null;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();

    if ([
      'true', 'yes', 'y', '1', 'obtained', 'active', 'complete', 'completed',
      'attached', 'available', 'present', 'valid', 'in network', 'in-network'
    ].includes(lower)) {
      return true;
    }

    if ([
      'false', 'no', 'n', '0', 'missing', 'inactive', 'incomplete',
      'not attached', 'unavailable', 'absent', 'invalid', 'out of network',
      'out-of-network'
    ].includes(lower)) {
      return false;
    }
  }

  return false;
}

function parseICD10Codes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => sanitizeString(String(v), 10))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,;|\n]/)
      .map((code) => sanitizeString(code.trim(), 10))
      .filter(Boolean);
  }

  return [];
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,€£¥₹]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function mapRowToClaim(row: Record<string, unknown>): Partial<ClaimData> {
  const claim: Partial<ClaimData> = {};

  for (const [columnName, value] of Object.entries(row)) {
    const field = mapColumnToField(columnName);

    if (!field || value === null || value === undefined || value === '') {
      continue;
    }

    switch (field) {
      case 'patientName':
        claim.patientName = sanitizeString(String(value), 200);
        break;

      case 'patientId':
        claim.patientId = sanitizeString(String(value), 50);
        break;

      case 'payerName':
        claim.payerName = sanitizeString(String(value), 200);
        break;

      case 'cptCode':
        claim.cptCode = sanitizeString(String(value), 10);
        break;

      case 'icd10Codes':
        claim.icd10Codes = parseICD10Codes(value);
        break;

      case 'billedAmount': {
        const amount = sanitizeNumber(parseAmount(value), 0, 10000000);
        if (amount !== null) claim.billedAmount = amount;
        break;
      }

      case 'patientAge': {
        const age = sanitizeNumber(value, 0, 120);
        if (age !== null) claim.patientAge = Math.round(age);
        break;
      }

      case 'providerNpi':
        claim.providerNpi = sanitizeString(String(value), 20).replace(/\D/g, '').slice(0, 10);
        break;

      case 'placeOfService':
        claim.placeOfService = sanitizeString(String(value), 10).replace(/\D/g, '').slice(0, 2).padStart(2, '0');
        break;

      case 'priorAuthObtained':
        claim.priorAuthObtained = parseBoolean(value);
        break;

      case 'insuranceActive':
        claim.insuranceActive = parseBoolean(value);
        break;

      case 'documentationComplete':
        claim.documentationComplete = parseBoolean(value);
        break;

      case 'dischargeSummary':
        claim.dischargeSummary = parseBoolean(value);
        break;

      case 'investigationReports':
        claim.investigationReports = parseBoolean(value);
        break;

      case 'billBreakup':
        claim.billBreakup = parseBoolean(value);
        break;

      case 'prescriptionAttached':
        claim.prescriptionAttached = parseBoolean(value);
        break;

      case 'networkHospital':
        claim.networkHospital = parseBoolean(value);
        break;
    }
  }

  return claim;
}

export function hasMinimumFields(claim: Partial<ClaimData>): boolean {
  return !!(
    claim.patientName &&
    claim.patientId &&
    claim.payerName &&
    (claim.cptCode || (claim.icd10Codes && claim.icd10Codes.length > 0))
  );
}

export function fillDefaultValues(claim: Partial<ClaimData>): ClaimData {
  return {
    patientName: claim.patientName || 'Unknown',
    patientId: claim.patientId || `UNK-${Date.now()}`,
    payerName: claim.payerName || 'Unknown Payer',
    cptCode: claim.cptCode || '99213',
    icd10Codes: claim.icd10Codes || ['Z00.00'],
    billedAmount: claim.billedAmount ?? 0,
    patientAge: claim.patientAge ?? 0,
    providerNpi: claim.providerNpi || '0000000000',
    placeOfService: claim.placeOfService || '11',
    priorAuthObtained: claim.priorAuthObtained ?? false,
    insuranceActive: claim.insuranceActive ?? true,
    documentationComplete: claim.documentationComplete ?? false,
    dischargeSummary: claim.dischargeSummary ?? false,
    investigationReports: claim.investigationReports ?? false,
    billBreakup: claim.billBreakup ?? false,
    prescriptionAttached: claim.prescriptionAttached ?? false,
    networkHospital: claim.networkHospital ?? false
  };
}