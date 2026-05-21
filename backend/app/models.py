from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

RiskTier = Literal["LOW", "MEDIUM", "HIGH"]
ClientType = Literal["INDIVIDUAL", "ENTITY"]
KycStatus = Literal["APPROVED", "PENDING", "REJECTED", "ENHANCED_DUE_DILIGENCE"]

SOURCE_OF_FUNDS_OPTIONS = [
    "Employment",
    "Business Income",
    "Investment Returns",
    "Inheritance",
    "Property Sale",
    "Pension",
    "Gift",
    "Other",
]

BRANCHES = ["Mayfair", "Edinburgh", "Manchester", "Canary Wharf"]


class OnboardingRecord(BaseModel):
    client_id: str
    branch: str
    onboarding_date: date
    client_name: str
    client_type: ClientType
    country_of_tax_residence: str
    annual_income: float = Field(ge=0)
    source_of_funds: str
    pep_status: bool
    sanctions_screening_match: bool
    adverse_media_flag: bool
    risk_classification: RiskTier
    kyc_status: KycStatus
    id_verification_date: date | None = None
    relationship_manager: str
    documentation_complete: bool
    # Computed on read — not stored in CSV
    computed_risk: RiskTier | None = None
    risk_mismatch: bool = False
    missing_fields: list[str] = Field(default_factory=list)
    audit_findings: list[str] = Field(default_factory=list)

    @field_validator("relationship_manager", mode="before")
    @classmethod
    def strip_rm(cls, v: str | None) -> str:
        return (v or "").strip()


class OnboardingRecordCreate(BaseModel):
    branch: str
    client_name: str
    client_type: ClientType
    country_of_tax_residence: str
    annual_income: float = Field(ge=0)
    source_of_funds: str
    pep_status: bool = False
    sanctions_screening_match: bool = False
    adverse_media_flag: bool = False
    kyc_status: KycStatus = "PENDING"
    id_verification_date: date | None = None
    relationship_manager: str
    documentation_complete: bool = False

    @field_validator("relationship_manager", "client_name", "country_of_tax_residence")
    @classmethod
    def required_non_empty(cls, v: str) -> str:
        if not v or not str(v).strip():
            raise ValueError("Field is required")
        return str(v).strip()

    @field_validator("source_of_funds")
    @classmethod
    def valid_source(cls, v: str) -> str:
        if v not in SOURCE_OF_FUNDS_OPTIONS:
            raise ValueError(f"source_of_funds must be one of {SOURCE_OF_FUNDS_OPTIONS}")
        return v


class ClassifyRequest(BaseModel):
    client_type: ClientType
    country_of_tax_residence: str
    annual_income: float = Field(ge=0)
    source_of_funds: str
    pep_status: bool = False
    sanctions_screening_match: bool = False
    adverse_media_flag: bool = False


class ClassifyResponse(BaseModel):
    risk_classification: RiskTier
    triggered_rules: list[str]
    requires_edd: bool
    compliance_note: str


class AuditSummary(BaseModel):
    total_records: int
    records_with_findings: int
    risk_mismatches: int
    missing_field_records: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    by_branch: dict[str, int]
