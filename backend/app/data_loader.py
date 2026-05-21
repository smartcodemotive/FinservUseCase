"""Load and enrich onboarding records from CSV."""

from __future__ import annotations

import csv
from datetime import date, datetime
from pathlib import Path

from .models import OnboardingRecord
from .risk_engine import classify_risk

CSV_PATH = Path(__file__).resolve().parent.parent.parent / "client_onboarding.csv"


def _parse_bool(value: str) -> bool:
    return str(value).strip().upper() == "TRUE"


def _parse_date(value: str) -> date | None:
    value = (value or "").strip()
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def _parse_float(value: str) -> float:
    return float((value or "0").strip().replace(",", ""))


def _missing_fields(row: dict) -> list[str]:
    missing: list[str] = []
    if not (row.get("relationship_manager") or "").strip():
        missing.append("relationship_manager")
    if not (row.get("id_verification_date") or "").strip():
        missing.append("id_verification_date")
    if not (row.get("client_name") or "").strip():
        missing.append("client_name")
    if not (row.get("country_of_tax_residence") or "").strip():
        missing.append("country_of_tax_residence")
    return missing


def _audit_findings(record: OnboardingRecord) -> list[str]:
    findings: list[str] = []
    if record.missing_fields:
        findings.append(f"Missing required fields: {', '.join(record.missing_fields)}")
    if record.risk_mismatch:
        findings.append(
            f"Risk classification mismatch: recorded {record.risk_classification}, "
            f"computed {record.computed_risk}"
        )
    if record.computed_risk == "HIGH" and record.kyc_status == "APPROVED":
        findings.append("HIGH-risk client approved without EDD pathway")
    if record.pep_status and record.computed_risk == "LOW":
        findings.append("PEP classified as LOW risk")
    return findings


def enrich_record(raw: dict) -> OnboardingRecord:
    missing = _missing_fields(raw)
    computed = classify_risk(
        pep_status=_parse_bool(raw["pep_status"]),
        sanctions_screening_match=_parse_bool(raw["sanctions_screening_match"]),
        adverse_media_flag=_parse_bool(raw["adverse_media_flag"]),
        country_of_tax_residence=raw["country_of_tax_residence"],
        client_type=raw["client_type"],
        annual_income=_parse_float(raw["annual_income"]),
        source_of_funds=raw["source_of_funds"],
    )
    recorded = raw["risk_classification"].strip().upper()

    record = OnboardingRecord(
        client_id=raw["client_id"].strip(),
        branch=raw["branch"].strip(),
        onboarding_date=_parse_date(raw["onboarding_date"]),  # type: ignore[arg-type]
        client_name=raw["client_name"].strip(),
        client_type=raw["client_type"].strip(),  # type: ignore[arg-type]
        country_of_tax_residence=raw["country_of_tax_residence"].strip(),
        annual_income=_parse_float(raw["annual_income"]),
        source_of_funds=raw["source_of_funds"].strip(),
        pep_status=_parse_bool(raw["pep_status"]),
        sanctions_screening_match=_parse_bool(raw["sanctions_screening_match"]),
        adverse_media_flag=_parse_bool(raw["adverse_media_flag"]),
        risk_classification=recorded,  # type: ignore[arg-type]
        kyc_status=raw["kyc_status"].strip(),  # type: ignore[arg-type]
        id_verification_date=_parse_date(raw.get("id_verification_date", "")),
        relationship_manager=raw.get("relationship_manager", ""),
        documentation_complete=_parse_bool(raw["documentation_complete"]),
        computed_risk=computed,
        risk_mismatch=recorded != computed,
        missing_fields=missing,
    )
    record.audit_findings = _audit_findings(record)
    return record


def load_csv(path: Path | None = None) -> list[OnboardingRecord]:
    csv_file = path or CSV_PATH
    records: list[OnboardingRecord] = []
    with open(csv_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(enrich_record(row))
    return records
