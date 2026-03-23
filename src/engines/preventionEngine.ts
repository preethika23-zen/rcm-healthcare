import type { ClaimData, PreventionAction, PreventionResult, EligibilityResult, RiskPrediction } from '../types/claim';
import { generateSecureId, validateNPI } from '../utils/security';


interface PreventionTemplate {
  id: string;
  trigger: (claim: ClaimData, eligibility: EligibilityResult, risk: RiskPrediction) => boolean;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedImpact: number; 
}

const PREVENTION_TEMPLATES: PreventionTemplate[] = [

  {
    id: 'verify_insurance',
    trigger: (claim) => !claim.insuranceActive,
    action: 'Verify active insurance coverage with payer before submission. Contact patient if coverage lapsed.',
    priority: 'high',
    category: 'Coverage',
    estimatedImpact: 35
  },
  {
    id: 'obtain_prior_auth',
    trigger: (claim) => !claim.priorAuthObtained,
    action: 'Obtain prior authorization from payer. Submit authorization request with clinical documentation.',
    priority: 'high',
    category: 'Authorization',
    estimatedImpact: 20
  },
  {
    id: 'complete_documentation',
    trigger: (claim) => !claim.documentationComplete,
    action: 'Ensure all required documentation is attached: clinical notes, test results, and supporting evidence.',
    priority: 'high',
    category: 'Documentation',
    estimatedImpact: 15
  },
  

  {
    id: 'validate_npi',
    trigger: (claim) => !validateNPI(claim.providerNpi),
    action: 'Verify and correct Provider NPI. Ensure the NPI is active and registered with payer.',
    priority: 'high',
    category: 'Provider',
    estimatedImpact: 15
  },
  {
    id: 'check_provider_enrollment',
    trigger: (_claim, eligibility) => eligibility.eligibilityIssues.some(i => i.includes('NPI')),
    action: 'Confirm provider enrollment status with payer network.',
    priority: 'medium',
    category: 'Provider',
    estimatedImpact: 10
  },
  
 
  {
    id: 'review_cpt_coding',
    trigger: (_, __, risk) => risk.reasons.some(r => r.toLowerCase().includes('cpt')),
    action: 'Review CPT code selection. Ensure code accurately reflects services rendered and documentation.',
    priority: 'medium',
    category: 'Coding',
    estimatedImpact: 12
  },
  {
    id: 'review_icd_coding',
    trigger: (_, __, risk) => risk.reasons.some(r => r.toLowerCase().includes('icd')),
    action: 'Review ICD-10 diagnosis codes. Ensure specificity and medical necessity support.',
    priority: 'medium',
    category: 'Coding',
    estimatedImpact: 12
  },
  {
    id: 'verify_code_linkage',
    trigger: (_, __, risk) => risk.reasons.some(r => r.toLowerCase().includes('mismatch')),
    action: 'Verify diagnosis-procedure code linkage. Ensure diagnosis supports medical necessity for procedure.',
    priority: 'high',
    category: 'Coding',
    estimatedImpact: 10
  },
  {
    id: 'add_modifier_if_needed',
    trigger: (claim) => claim.billedAmount > 10000,
    action: 'Review if procedure modifiers are needed (e.g., bilateral, multiple procedures, unusual circumstances).',
    priority: 'low',
    category: 'Coding',
    estimatedImpact: 5
  },
  
  
  {
    id: 'verify_pos',
    trigger: (_, __, risk) => risk.reasons.some(r => r.toLowerCase().includes('place of service')),
    action: 'Verify place of service code matches actual service location and is valid for procedure.',
    priority: 'medium',
    category: 'Service',
    estimatedImpact: 10
  },
  
  
  {
    id: 'review_billing_amount',
    trigger: (_, __, risk) => risk.reasons.some(r => r.toLowerCase().includes('amount')),
    action: 'Review billed amount against fee schedule. Ensure charges are within expected range.',
    priority: 'medium',
    category: 'Billing',
    estimatedImpact: 8
  },
  {
    id: 'fee_schedule_check',
    trigger: (claim) => claim.billedAmount > 25000,
    action: 'For high-value claims, attach itemized bill and verify pricing against contracted rates.',
    priority: 'medium',
    category: 'Billing',
    estimatedImpact: 8
  },
  

  {
    id: 'medicare_lcd_check',
    trigger: (claim) => claim.payerName.toLowerCase().includes('medicare'),
    action: 'Review Local Coverage Determination (LCD) and National Coverage Determination (NCD) requirements.',
    priority: 'medium',
    category: 'Payer',
    estimatedImpact: 5
  },
  {
    id: 'medicaid_eligibility_verify',
    trigger: (claim) => claim.payerName.toLowerCase().includes('medicaid'),
    action: 'Verify Medicaid eligibility on date of service. Check for any coverage restrictions.',
    priority: 'medium',
    category: 'Payer',
    estimatedImpact: 5
  },
  
 
  {
    id: 'pediatric_coding_review',
    trigger: (claim) => claim.patientAge < 2,
    action: 'Review pediatric-specific coding guidelines. Ensure age-appropriate codes are used.',
    priority: 'low',
    category: 'Patient',
    estimatedImpact: 3
  },
  {
    id: 'geriatric_documentation',
    trigger: (claim) => claim.patientAge > 85,
    action: 'Include additional documentation for geriatric patient medical necessity.',
    priority: 'low',
    category: 'Patient',
    estimatedImpact: 3
  },
  
  
  {
    id: 'timely_filing',
    trigger: () => true, 
    action: 'Submit claim within timely filing deadline. Most payers require submission within 90-365 days.',
    priority: 'low',
    category: 'Process',
    estimatedImpact: 5
  },
  {
    id: 'claim_scrubbing',
    trigger: (_, __, risk) => risk.riskScore > 30,
    action: 'Run claim through automated claim scrubber before submission to catch additional errors.',
    priority: 'medium',
    category: 'Process',
    estimatedImpact: 10
  }
];


export function generatePreventionActions(
  claim: ClaimData,
  eligibility: EligibilityResult,
  risk: RiskPrediction
): PreventionResult {
  const actions: PreventionAction[] = [];
  let totalImpact = 0;
  
 
  for (const template of PREVENTION_TEMPLATES) {
    try {
      if (template.trigger(claim, eligibility, risk)) {
        actions.push({
          id: generateSecureId(),
          action: template.action,
          priority: template.priority,
          category: template.category,
          estimatedImpact: template.estimatedImpact
        });
        totalImpact += template.estimatedImpact;
      }
    } catch {
    
    }
  }
  
  
  actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.estimatedImpact - a.estimatedImpact;
  });
  
 
  const denialProbability = risk.riskScore / 100;
  const potentialLoss = claim.billedAmount * denialProbability;
  const preventionEffectiveness = Math.min(totalImpact, 90) / 100;
  const potentialSavings = potentialLoss * preventionEffectiveness;
  
  return {
    preventionActions: actions,
    potentialSavings: Math.round(potentialSavings * 100) / 100,
    timestamp: new Date().toISOString()
  };
}


export function getBatchPreventionSummary(
  results: { claim: ClaimData; eligibility: EligibilityResult; risk: RiskPrediction }[]
): {
  totalPotentialSavings: number;
  topActions: { action: string; frequency: number; totalImpact: number }[];
  actionsByCategory: { category: string; count: number; actions: string[] }[];
} {
  const actionCounts: Record<string, { action: string; frequency: number; totalImpact: number }> = {};
  const categoryActions: Record<string, Set<string>> = {};
  let totalSavings = 0;
  
  for (const { claim, eligibility, risk } of results) {
    const prevention = generatePreventionActions(claim, eligibility, risk);
    totalSavings += prevention.potentialSavings;
    
    for (const action of prevention.preventionActions) {
     
      if (!actionCounts[action.action]) {
        actionCounts[action.action] = { action: action.action, frequency: 0, totalImpact: 0 };
      }
      actionCounts[action.action].frequency++;
      actionCounts[action.action].totalImpact += action.estimatedImpact;
      
      
      if (!categoryActions[action.category]) {
        categoryActions[action.category] = new Set();
      }
      categoryActions[action.category].add(action.action);
    }
  }
  

  const topActions = Object.values(actionCounts)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  

  const actionsByCategory = Object.entries(categoryActions).map(([category, actions]) => ({
    category,
    count: actions.size,
    actions: Array.from(actions)
  }));
  
  return {
    totalPotentialSavings: Math.round(totalSavings * 100) / 100,
    topActions,
    actionsByCategory
  };
}


export function generateActionChecklist(
  claim: ClaimData,
  eligibility: EligibilityResult,
  risk: RiskPrediction
): {
  id: string;
  action: string;
  completed: boolean;
  required: boolean;
}[] {
  const prevention = generatePreventionActions(claim, eligibility, risk);
  
  return prevention.preventionActions.map(action => ({
    id: action.id,
    action: action.action,
    completed: false,
    required: action.priority === 'high'
  }));
}
