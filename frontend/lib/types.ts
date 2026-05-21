export type RiskTier = "LOW" | "MEDIUM" | "HIGH";
export type ClientType = "INDIVIDUAL" | "ENTITY";
export type KycStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "ENHANCED_DUE_DILIGENCE";

export interface OnboardingRecord {
  client_id: string;
  branch: string;
  onboarding_date: string;
  client_name: string;
  client_type: ClientType;
  country_of_tax_residence: string;
  annual_income: number;
  source_of_funds: string;
  pep_status: boolean;
  sanctions_screening_match: boolean;
  adverse_media_flag: boolean;
  risk_classification: RiskTier;
  kyc_status: KycStatus;
  id_verification_date: string | null;
  relationship_manager: string;
  documentation_complete: boolean;
  computed_risk: RiskTier | null;
  risk_mismatch: boolean;
  missing_fields: string[];
  audit_findings: string[];
}

export interface ClassifyResponse {
  risk_classification: RiskTier;
  triggered_rules: string[];
  requires_edd: boolean;
  compliance_note: string;
}

export interface AuditSummary {
  total_records: number;
  records_with_findings: number;
  risk_mismatches: number;
  missing_field_records: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  by_branch: Record<string, number>;
}

export interface FormOptions {
  branches: string[];
  client_types: string[];
  source_of_funds: string[];
  kyc_statuses: string[];
  countries_high: string[];
  countries_medium: string[];
}

export interface OnboardingRecordCreate {
  branch: string;
  client_name: string;
  client_type: ClientType;
  country_of_tax_residence: string;
  annual_income: number;
  source_of_funds: string;
  pep_status: boolean;
  sanctions_screening_match: boolean;
  adverse_media_flag: boolean;
  kyc_status: KycStatus;
  id_verification_date: string;
  relationship_manager: string;
  documentation_complete: boolean;
}
