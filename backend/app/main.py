"""SENTINEL Onboarding API — Halcyon Capital Partners."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .data_loader import load_csv
from .models import (
    AuditSummary,
    ClassifyRequest,
    ClassifyResponse,
    OnboardingRecord,
    OnboardingRecordCreate,
)
from .risk_engine import classify_risk, get_triggered_rules

app = FastAPI(
    title="SENTINEL Onboarding API",
    description="Client onboarding risk assessment — Halcyon Capital Partners",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store: CSV seed + new assessments
_records: list[OnboardingRecord] = []
_next_id = 47


def _compliance_note(tier: str) -> str:
    if tier == "HIGH":
        return (
            "Enhanced Due Diligence (EDD) required. "
            "Cannot approve without senior compliance sign-off."
        )
    if tier == "MEDIUM":
        return (
            "Additional documentation required. "
            "Compliance officer may escalate to EDD at discretion."
        )
    return "Standard onboarding pathway applies."


@app.on_event("startup")
def startup() -> None:
    global _records
    _records = load_csv()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sentinel-onboarding"}


@app.get("/api/records", response_model=list[OnboardingRecord])
def list_records(
    branch: Annotated[str | None, Query()] = None,
    findings_only: Annotated[bool, Query()] = False,
    risk: Annotated[str | None, Query()] = None,
) -> list[OnboardingRecord]:
    result = _records
    if branch:
        result = [r for r in result if r.branch == branch]
    if risk:
        result = [r for r in result if r.computed_risk == risk.upper()]
    if findings_only:
        result = [r for r in result if r.audit_findings]
    return result


@app.get("/api/records/{client_id}", response_model=OnboardingRecord)
def get_record(client_id: str) -> OnboardingRecord:
    for r in _records:
        if r.client_id == client_id:
            return r
    raise HTTPException(status_code=404, detail="Record not found")


@app.post("/api/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest) -> ClassifyResponse:
    tier = classify_risk(
        pep_status=payload.pep_status,
        sanctions_screening_match=payload.sanctions_screening_match,
        adverse_media_flag=payload.adverse_media_flag,
        country_of_tax_residence=payload.country_of_tax_residence,
        client_type=payload.client_type,
        annual_income=payload.annual_income,
        source_of_funds=payload.source_of_funds,
    )
    triggers = get_triggered_rules(
        pep_status=payload.pep_status,
        sanctions_screening_match=payload.sanctions_screening_match,
        adverse_media_flag=payload.adverse_media_flag,
        country_of_tax_residence=payload.country_of_tax_residence,
        client_type=payload.client_type,
        annual_income=payload.annual_income,
        source_of_funds=payload.source_of_funds,
    )
    return ClassifyResponse(
        risk_classification=tier,
        triggered_rules=triggers,
        requires_edd=tier == "HIGH",
        compliance_note=_compliance_note(tier),
    )


@app.post("/api/records", response_model=OnboardingRecord, status_code=201)
def create_record(payload: OnboardingRecordCreate) -> OnboardingRecord:
    global _next_id

    if not payload.id_verification_date:
        raise HTTPException(
            status_code=422,
            detail="id_verification_date is required — records with missing fields cannot be saved",
        )
    if not payload.documentation_complete:
        raise HTTPException(
            status_code=422,
            detail="documentation_complete must be TRUE before submission",
        )

    tier = classify_risk(
        pep_status=payload.pep_status,
        sanctions_screening_match=payload.sanctions_screening_match,
        adverse_media_flag=payload.adverse_media_flag,
        country_of_tax_residence=payload.country_of_tax_residence,
        client_type=payload.client_type,
        annual_income=payload.annual_income,
        source_of_funds=payload.source_of_funds,
    )

    if tier == "HIGH" and payload.kyc_status == "APPROVED":
        raise HTTPException(
            status_code=422,
            detail="HIGH-risk clients cannot be APPROVED without EDD sign-off",
        )

    client_id = f"CLT-{str(_next_id).zfill(3)}"
    _next_id += 1

    record = OnboardingRecord(
        client_id=client_id,
        branch=payload.branch,
        onboarding_date=date.today(),
        client_name=payload.client_name,
        client_type=payload.client_type,
        country_of_tax_residence=payload.country_of_tax_residence,
        annual_income=payload.annual_income,
        source_of_funds=payload.source_of_funds,
        pep_status=payload.pep_status,
        sanctions_screening_match=payload.sanctions_screening_match,
        adverse_media_flag=payload.adverse_media_flag,
        risk_classification=tier,
        kyc_status="ENHANCED_DUE_DILIGENCE" if tier == "HIGH" else payload.kyc_status,
        id_verification_date=payload.id_verification_date,
        relationship_manager=payload.relationship_manager,
        documentation_complete=payload.documentation_complete,
        computed_risk=tier,
        risk_mismatch=False,
        missing_fields=[],
        audit_findings=[],
    )
    _records.insert(0, record)
    return record


@app.get("/api/audit/summary", response_model=AuditSummary)
def audit_summary() -> AuditSummary:
    by_branch: dict[str, int] = {}
    findings = 0
    mismatches = 0
    missing = 0
    high = medium = low = 0

    for r in _records:
        by_branch[r.branch] = by_branch.get(r.branch, 0) + 1
        if r.audit_findings:
            findings += 1
        if r.risk_mismatch:
            mismatches += 1
        if r.missing_fields:
            missing += 1
        tier = r.computed_risk or r.risk_classification
        if tier == "HIGH":
            high += 1
        elif tier == "MEDIUM":
            medium += 1
        else:
            low += 1

    return AuditSummary(
        total_records=len(_records),
        records_with_findings=findings,
        risk_mismatches=mismatches,
        missing_field_records=missing,
        high_risk_count=high,
        medium_risk_count=medium,
        low_risk_count=low,
        by_branch=by_branch,
    )


@app.get("/api/meta/options")
def form_options() -> dict:
    from .models import BRANCHES, SOURCE_OF_FUNDS_OPTIONS

    return {
        "branches": BRANCHES,
        "client_types": ["INDIVIDUAL", "ENTITY"],
        "source_of_funds": SOURCE_OF_FUNDS_OPTIONS,
        "kyc_statuses": ["APPROVED", "PENDING", "REJECTED", "ENHANCED_DUE_DILIGENCE"],
        "countries_high": ["Russia", "Belarus", "Venezuela"],
        "countries_medium": [
            "Brazil",
            "Turkey",
            "South Africa",
            "Mexico",
            "UAE",
            "China",
        ],
    }
