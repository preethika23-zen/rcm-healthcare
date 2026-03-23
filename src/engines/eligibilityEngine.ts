
import type { ClaimData, EligibilityResult } from '../types/claim';
import { validateNPI, validateCPTCode, validateICD10Code, validatePlaceOfService } from '../utils/security';


interface EligibilityCheck {
  name: string;
  description: string;
  check: (claim: ClaimData) => boolean;
  issue: string;
}

const ELIGIBILITY_CHECKS: EligibilityCheck[] = [
  {
    name: 'insurance_active',
    description: 'Insurance coverage must be active',
    check: (claim) => claim.insuranceActive === true,
    issue: 'Insurance coverage is inactive or not verified'
  },
  {
    name: 'documentation_complete',
    description: 'Required documentation must be complete',
    check: (claim) => claim.documentationComplete === true,
    issue: 'Documentation is incomplete or missing'
  },
  {
    name: 'diagnosis_present',
    description: 'At least one diagnosis code required',
    check: (claim) => claim.icd10Codes && claim.icd10Codes.length > 0,
    issue: 'Missing diagnosis code (ICD-10)'
  },
  {
    name: 'procedure_present',
    description: 'Procedure code is required',
    check: (claim) => !!claim.cptCode && claim.cptCode.length >= 5,
    issue: 'Missing or invalid procedure code (CPT)'
  },
  {
    name: 'npi_valid',
    description: 'Provider NPI must be valid',
    check: (claim) => validateNPI(claim.providerNpi),
    issue: 'Invalid or missing Provider NPI'
  },
  {
    name: 'cpt_format_valid',
    description: 'CPT code format must be valid',
    check: (claim) => validateCPTCode(claim.cptCode),
    issue: 'CPT code format is invalid'
  },
  {
    name: 'icd10_format_valid',
    description: 'All ICD-10 codes must be valid',
    check: (claim) => claim.icd10Codes.every(code => validateICD10Code(code)),
    issue: 'One or more ICD-10 codes have invalid format'
  },
  {
    name: 'pos_valid',
    description: 'Place of service code must be valid',
    check: (claim) => validatePlaceOfService(claim.placeOfService),
    issue: 'Invalid place of service code'
  },
  {
    name: 'patient_info_complete',
    description: 'Patient information must be complete',
    check: (claim) => !!claim.patientName && !!claim.patientId,
    issue: 'Patient name or ID is missing'
  },
  {
    name: 'payer_identified',
    description: 'Payer must be identified',
    check: (claim) => !!claim.payerName && claim.payerName.length >= 2,
    issue: 'Payer/Insurance company not identified'
  },
  {
    name: 'billed_amount_valid',
    description: 'Billed amount must be positive',
    check: (claim) => claim.billedAmount > 0,
    issue: 'Billed amount is zero or negative'
  },
  {
    name: 'patient_age_valid',
    description: 'Patient age must be valid',
    check: (claim) => claim.patientAge >= 0 && claim.patientAge <= 120,
    issue: 'Patient age is invalid'
  }
];

export function checkEligibility(claim: ClaimData): EligibilityResult {
  const issues: string[] = [];
  
  for (const check of ELIGIBILITY_CHECKS) {
    try {
      if (!check.check(claim)) {
        issues.push(check.issue);
      }
    } catch {
      issues.push(`Error checking ${check.name}`);
    }
  }
  
  return {
    eligible: issues.length === 0,
    eligibilityIssues: issues,
    timestamp: new Date().toISOString()
  };
}


export function getEligibilityReport(claim: ClaimData): {
  overallStatus: 'eligible' | 'needs_review' | 'ineligible';
  passedChecks: string[];
  failedChecks: { name: string; issue: string }[];
  recommendations: string[];
} {
  const passedChecks: string[] = [];
  const failedChecks: { name: string; issue: string }[] = [];
  const recommendations: string[] = [];
  
  for (const check of ELIGIBILITY_CHECKS) {
    try {
      if (check.check(claim)) {
        passedChecks.push(check.description);
      } else {
        failedChecks.push({ name: check.name, issue: check.issue });
      }
    } catch {
      failedChecks.push({ name: check.name, issue: `Error during ${check.name} check` });
    }
  }

  for (const failed of failedChecks) {
    switch (failed.name) {
      case 'insurance_active':
        recommendations.push('Verify patient insurance eligibility before claim submission');
        break;
      case 'documentation_complete':
        recommendations.push('Ensure all required documentation is attached');
        break;
      case 'diagnosis_present':
        recommendations.push('Add appropriate diagnosis codes (ICD-10)');
        break;
      case 'procedure_present':
        recommendations.push('Add valid procedure code (CPT/HCPCS)');
        break;
      case 'npi_valid':
        recommendations.push('Verify and correct provider NPI');
        break;
      case 'cpt_format_valid':
        recommendations.push('Review CPT code format (should be 5 digits)');
        break;
      case 'icd10_format_valid':
        recommendations.push('Review ICD-10 code formats');
        break;
      case 'pos_valid':
        recommendations.push('Verify place of service code (should be 2 digits)');
        break;
      case 'billed_amount_valid':
        recommendations.push('Enter a valid billed amount');
        break;
    }
  }
  

  let overallStatus: 'eligible' | 'needs_review' | 'ineligible';
  
  const criticalFails = failedChecks.filter(f => 
    ['insurance_active', 'npi_valid', 'diagnosis_present', 'procedure_present'].includes(f.name)
  );
  
  if (failedChecks.length === 0) {
    overallStatus = 'eligible';
  } else if (criticalFails.length > 0) {
    overallStatus = 'ineligible';
  } else {
    overallStatus = 'needs_review';
  }
  
  return {
    overallStatus,
    passedChecks,
    failedChecks,
    recommendations
  };
}
