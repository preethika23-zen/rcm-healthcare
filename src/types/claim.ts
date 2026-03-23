export interface ClaimData {
  patientName: string;
  patientId: string;
  payerName: string;
  cptCode: string;
  icd10Codes: string[];
  billedAmount: number;
  patientAge: number;
  providerNpi: string;
  placeOfService: string;
  priorAuthObtained: boolean;
  insuranceActive: boolean;
  documentationComplete: boolean;
  dischargeSummary: boolean;
  investigationReports: boolean;
  billBreakup: boolean;
  prescriptionAttached: boolean;
  networkHospital: boolean;
}


export interface EligibilityResult {
  eligible: boolean;
  eligibilityIssues: string[];
  timestamp: string;
}


export interface RiskPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
  reasons: string[];
  timestamp: string;
}


export interface PreventionAction {
  id: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedImpact: number;
}


export interface PreventionResult {
  preventionActions: PreventionAction[];
  potentialSavings: number;
  timestamp: string;
}


export interface ClaimAnalysisResult {
  id: string;
  claim: ClaimData;
  eligibility: EligibilityResult;
  riskPrediction: RiskPrediction;
  prevention: PreventionResult;
  analyzedAt: string;
}


export interface BatchResult {
  totalClaims: number;
  eligibleCount: number;
  ineligibleCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  processedAt: string;
  processingTimeMs: number;
  results: ClaimAnalysisResult[];
}


export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}


export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limited: boolean;
}


export interface FileUploadResult {
  success: boolean;
  fileName: string;
  fileType: 'excel' | 'csv' | 'pdf';
  recordCount: number;
  claims: Partial<ClaimData>[];
  errors: string[];
}


export interface DashboardStats {
  totalClaimsAnalyzed: number;
  averageRiskScore: number;
  denialsPrevented: number;
  potentialSavings: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  topDenialReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

export const COMMON_CPT_CODES = [
  '99201', '99202', '99203', '99204', '99205',
  '99211', '99212', '99213', '99214', '99215',
  '99221', '99222', '99223', '99231', '99232', '99233',
  '99281', '99282', '99283', '99284', '99285',
  '99291', '99292', '99354', '99355', '99356', '99357',
  '90834', '90837', '90847', '90853',
  '97110', '97112', '97116', '97140', '97530',
  '36415', '36416', '80053', '85025', '81001',
  '71046', '71047', '71048', '72170', '73030',
  '43239', '45378', '45380', '45385', '49505',
  '27447', '27130', '29881', '63030', '66984'
];


export const COMMON_ICD10_CODES = [
  'E11.9', 'I10', 'J06.9', 'M54.5', 'Z23',
  'E78.5', 'I25.10', 'J18.9', 'M79.3', 'Z00.00',
  'F32.9', 'K21.0', 'N39.0', 'R10.9', 'Z01.00',
  'G43.909', 'L03.90', 'R05.9', 'S72.001A', 'Z12.31',
  'A09', 'B34.9', 'C50.911', 'D64.9', 'E03.9',
  'F41.9', 'G47.00', 'H52.4', 'I48.91', 'J45.909'
];

export const PAYER_NAMES = [
  'Medicare', 'Medicaid', 'Blue Cross Blue Shield',
  'Aetna', 'Cigna', 'UnitedHealthcare', 'Humana',
  'Kaiser Permanente', 'Anthem', 'Centene',
  'Molina Healthcare', 'Health Net', 'Tricare',
  'Oscar Health', 'Bright Health', 'Clover Health'
];

export const PLACE_OF_SERVICE_CODES: Record<string, string> = {
  '11': 'Office',
  '12': 'Home',
  '19': 'Off Campus-Outpatient Hospital',
  '21': 'Inpatient Hospital',
  '22': 'On Campus-Outpatient Hospital',
  '23': 'Emergency Room - Hospital',
  '24': 'Ambulatory Surgical Center',
  '31': 'Skilled Nursing Facility',
  '32': 'Nursing Facility',
  '41': 'Ambulance - Land',
  '42': 'Ambulance - Air or Water',
  '50': 'Federally Qualified Health Center',
  '51': 'Inpatient Psychiatric Facility',
  '52': 'Psychiatric Facility-Partial Hospitalization',
  '53': 'Community Mental Health Center',
  '54': 'Intermediate Care Facility',
  '55': 'Residential Substance Abuse Treatment Facility',
  '56': 'Psychiatric Residential Treatment Center',
  '61': 'Comprehensive Inpatient Rehabilitation Facility',
  '62': 'Comprehensive Outpatient Rehabilitation Facility',
  '65': 'End-Stage Renal Disease Treatment Facility',
  '71': 'Public Health Clinic',
  '72': 'Rural Health Clinic',
  '81': 'Independent Laboratory',
  '99': 'Other Place of Service'
};
