"""SENTINEL risk classification — regulatory criteria engine."""

from __future__ import annotations

from typing import Literal

RiskTier = Literal["LOW", "MEDIUM", "HIGH"]

HIGH_RISK_COUNTRIES = frozenset({"Russia", "Belarus", "Venezuela"})
MEDIUM_RISK_COUNTRIES = frozenset(
    {"Brazil", "Turkey", "South Africa", "Mexico", "UAE", "China"}
)
MEDIUM_INCOME_SOURCES = frozenset({"Inheritance", "Gift", "Other"})
INCOME_THRESHOLD = 500_000


def classify_risk(
    *,
    pep_status: bool,
    sanctions_screening_match: bool,
    adverse_media_flag: bool,
    country_of_tax_residence: str,
    client_type: str,
    annual_income: float,
    source_of_funds: str,
) -> RiskTier:
    """Evaluate all conditions; return highest applicable tier."""
    country = (country_of_tax_residence or "").strip()

    if (
        pep_status
        or sanctions_screening_match
        or adverse_media_flag
        or country in HIGH_RISK_COUNTRIES
    ):
        return "HIGH"

    if client_type == "ENTITY" or country in MEDIUM_RISK_COUNTRIES:
        return "MEDIUM"

    if annual_income > INCOME_THRESHOLD and source_of_funds in MEDIUM_INCOME_SOURCES:
        return "MEDIUM"

    return "LOW"


def get_triggered_rules(
    *,
    pep_status: bool,
    sanctions_screening_match: bool,
    adverse_media_flag: bool,
    country_of_tax_residence: str,
    client_type: str,
    annual_income: float,
    source_of_funds: str,
) -> list[str]:
    """Human-readable list of rules that fired (for compliance defensibility)."""
    triggers: list[str] = []
    country = (country_of_tax_residence or "").strip()

    if pep_status:
        triggers.append("Politically Exposed Person (PEP)")
    if sanctions_screening_match:
        triggers.append("Sanctions list match (HMT/OFSI)")
    if adverse_media_flag:
        triggers.append("Adverse media screening flag")
    if country in HIGH_RISK_COUNTRIES:
        triggers.append(f"High-risk jurisdiction: {country}")

    if client_type == "ENTITY":
        triggers.append("Entity client type")
    if country in MEDIUM_RISK_COUNTRIES:
        triggers.append(f"Elevated jurisdiction: {country}")
    if annual_income > INCOME_THRESHOLD and source_of_funds in MEDIUM_INCOME_SOURCES:
        triggers.append(
            f"Income > £{INCOME_THRESHOLD:,} with source of funds: {source_of_funds}"
        )

    return triggers
