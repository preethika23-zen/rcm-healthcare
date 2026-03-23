import type { ClaimData, RiskPrediction } from '../types/claim';
import { validateNPI, validateCPTCode, validateICD10Code, validatePlaceOfService } from '../utils/security';
import { PLACE_OF_SERVICE_CODES } from '../types/claim';
interface RiskFactor {
  name: string;
  category: string;
  weight: number;
  check: (claim: ClaimData) => boolean;
  reason: string;
}

const RISK_FACTORS: RiskFactor[] = [

  {
    name: 'inactive_insurance',
    category: 'Coverage',
    weight: 35,
    check: (claim) => !claim.insuranceActive,
    reason: 'Insurance coverage is inactive - High denial risk'
  },
  
  
  {
    name: 'missing_prior_auth',
    category: 'Authorization',
    weight: 20,
    check: (claim) => !claim.priorAuthObtained,
    reason: 'Prior authorization not obtained'
  },
  
  
  {
    name: 'incomplete_documentation',
    category: 'Documentation',
    weight: 15,
    check: (claim) => !claim.documentationComplete,
    reason: 'Documentation is incomplete'
  },
  
  
  {
    name: 'invalid_npi',
    category: 'Provider',
    weight: 15,
    check: (claim) => !validateNPI(claim.providerNpi),
    reason: 'Provider NPI is invalid or missing'
  },
  
  
  {
    name: 'invalid_cpt_format',
    category: 'Coding',
    weight: 12,
    check: (claim) => !validateCPTCode(claim.cptCode),
    reason: 'CPT code format is invalid'
  },
  {
    name: 'invalid_icd10_format',
    category: 'Coding',
    weight: 12,
    check: (claim) => !claim.icd10Codes.every(code => validateICD10Code(code)),
    reason: 'One or more ICD-10 codes have invalid format'
  },
  {
    name: 'diagnosis_procedure_mismatch',
    category: 'Coding',
    weight: 10,
    check: (claim) => checkDiagnosisProcedureMismatch(claim),
    reason: 'Potential diagnosis-procedure code mismatch'
  },
  
  
  {
    name: 'invalid_pos',
    category: 'Service',
    weight: 10,
    check: (claim) => !validatePlaceOfService(claim.placeOfService),
    reason: 'Place of service code is invalid'
  },
  {
    name: 'uncommon_pos',
    category: 'Service',
    weight: 5,
    check: (claim) => !Object.keys(PLACE_OF_SERVICE_CODES).includes(claim.placeOfService),
    reason: 'Uncommon place of service code'
  },
  
  
  {
    name: 'abnormal_billed_amount_low',
    category: 'Billing',
    weight: 8,
    check: (claim) => claim.billedAmount < 10,
    reason: 'Billed amount appears abnormally low'
  },
  {
    name: 'abnormal_billed_amount_high',
    category: 'Billing',
    weight: 10,
    check: (claim) => claim.billedAmount > 50000,
    reason: 'Billed amount is unusually high - may require additional review'
  },
  
  
  {
    name: 'pediatric_special_handling',
    category: 'Patient',
    weight: 3,
    check: (claim) => claim.patientAge < 2,
    reason: 'Pediatric patient (under 2) may require special coding'
  },
  {
    name: 'geriatric_special_handling',
    category: 'Patient',
    weight: 3,
    check: (claim) => claim.patientAge > 90,
    reason: 'Geriatric patient (over 90) may require additional documentation'
  },
  
  
  {
    name: 'medicare_complexity',
    category: 'Payer',
    weight: 5,
    check: (claim) => claim.payerName.toLowerCase().includes('medicare'),
    reason: 'Medicare claims have stricter documentation requirements'
  },
  {
    name: 'medicaid_complexity',
    category: 'Payer',
    weight: 5,
    check: (claim) => claim.payerName.toLowerCase().includes('medicaid'),
    reason: 'Medicaid claims often require additional eligibility verification'
  },
  
  
  {
    name: 'many_diagnoses',
    category: 'Coding',
    weight: 5,
    check: (claim) => claim.icd10Codes.length > 10,
    reason: 'High number of diagnosis codes may trigger review'
  }
];


function checkDiagnosisProcedureMismatch(claim: ClaimData): boolean {
  const emCodes = ['99201', '99202', '99203', '99204', '99205', 
                   '99211', '99212', '99213', '99214', '99215'];
  
  if (emCodes.includes(claim.cptCode.substring(0, 5))) {
    return false;
  }
  
  if (claim.cptCode.startsWith('993')) { 
    const hasIllnessDiagnosis = claim.icd10Codes.some(code => 
      !code.startsWith('Z') 
    );
    return hasIllnessDiagnosis;
  }
  
  
  if (claim.cptCode.startsWith('971')) { 
    const hasMusculoskeletalDx = claim.icd10Codes.some(code =>
      code.startsWith('M') || code.startsWith('S') || code.startsWith('T')
    );
    return !hasMusculoskeletalDx;
  }
  
  return false;
}

function calculateConfidence(claim: ClaimData): number {
  let score = 100;
  
  
  if (!claim.patientName || claim.patientName === 'Unknown') score -= 10;
  if (!claim.patientId || claim.patientId.startsWith('UNK-')) score -= 10;
  if (claim.providerNpi === '0000000000') score -= 15;
  if (claim.billedAmount === 0) score -= 10;
  if (claim.patientAge === 0) score -= 5;
  if (claim.icd10Codes.length === 1 && claim.icd10Codes[0] === 'Z00.00') score -= 10;
  
  return Math.max(50, score);
}


export function predictDenialRisk(claim: ClaimData): RiskPrediction {
  let totalScore = 0;
  const reasons: string[] = [];
  const triggeredFactors: { factor: RiskFactor; score: number }[] = [];
  

  for (const factor of RISK_FACTORS) {
    try {
      if (factor.check(claim)) {
        totalScore += factor.weight;
        reasons.push(factor.reason);
        triggeredFactors.push({ factor, score: factor.weight });
      }
    } catch {
      
    }
  }
  

  totalScore = Math.min(100, totalScore);
  

  let riskLevel: 'low' | 'medium' | 'high';
  if (totalScore < 30) {
    riskLevel = 'low';
  } else if (totalScore < 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  

  const confidenceScore = calculateConfidence(claim);
  

  reasons.sort((a, b) => {
    const factorA = triggeredFactors.find(f => f.factor.reason === a);
    const factorB = triggeredFactors.find(f => f.factor.reason === b);
    return (factorB?.score || 0) - (factorA?.score || 0);
  });
  
  return {
    riskScore: totalScore,
    riskLevel,
    confidenceScore,
    reasons,
    timestamp: new Date().toISOString()
  };
}


export function getRiskBreakdown(claim: ClaimData): {
  category: string;
  score: number;
  maxScore: number;
  factors: { name: string; triggered: boolean; weight: number; reason: string }[];
}[] {
  const categories = [...new Set(RISK_FACTORS.map(f => f.category))];
  
  return categories.map(category => {
    const categoryFactors = RISK_FACTORS.filter(f => f.category === category);
    const factors = categoryFactors.map(factor => ({
      name: factor.name,
      triggered: factor.check(claim),
      weight: factor.weight,
      reason: factor.reason
    }));
    
    const score = factors.filter(f => f.triggered).reduce((sum, f) => sum + f.weight, 0);
    const maxScore = categoryFactors.reduce((sum, f) => sum + f.weight, 0);
    
    return { category, score, maxScore, factors };
  });
}


export function compareRisks(claims: ClaimData[]): {
  averageScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  topReasons: { reason: string; count: number }[];
} {
  const predictions = claims.map(predictDenialRisk);
  
  const reasonCounts: Record<string, number> = {};
  
  for (const prediction of predictions) {
    for (const reason of prediction.reasons) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }
  
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));
  
  return {
    averageScore: predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length,
    highRiskCount: predictions.filter(p => p.riskLevel === 'high').length,
    mediumRiskCount: predictions.filter(p => p.riskLevel === 'medium').length,
    lowRiskCount: predictions.filter(p => p.riskLevel === 'low').length,
    topReasons
  };
}
