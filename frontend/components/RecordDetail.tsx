"use client";

import { RiskBadge } from "./RiskBadge";
import type { OnboardingRecord } from "@/lib/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--neutral)" }}>{label}</div>
      <div style={{ fontSize: 15 }}>{value ?? "—"}</div>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value: boolean }) {
  return (
    <Field
      label={label}
      value={
        <span style={{ color: value ? "var(--error)" : "var(--success)", fontWeight: 600 }}>
          {value ? "TRUE" : "FALSE"}
        </span>
      }
    />
  );
}

export function RecordDetail({ record }: { record: OnboardingRecord | null }) {
  if (!record) {
    return (
      <div className="card" style={{ padding: 24, color: "var(--neutral)" }}>
        Select a record to view the full compliance snapshot.
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{record.client_name}</h2>
          <div style={{ color: "var(--neutral)", fontSize: 13 }}>{record.client_id}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--neutral)" }}>Recorded</div>
            <RiskBadge tier={record.risk_classification} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--neutral)" }}>Computed</div>
            <RiskBadge tier={record.computed_risk} />
          </div>
        </div>
      </div>

      {record.audit_findings.length > 0 && (
        <div
          style={{
            background: "rgba(155,34,38,0.08)",
            border: "1px solid rgba(155,34,38,0.25)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--error)", marginBottom: 8 }}>Audit findings</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {record.audit_findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-grid">
        <Field label="Branch" value={record.branch} />
        <Field label="Onboarding date" value={record.onboarding_date} />
        <Field label="Client type" value={record.client_type} />
        <Field label="Country of tax residence" value={record.country_of_tax_residence} />
        <Field
          label="Annual income (GBP)"
          value={record.annual_income.toLocaleString("en-GB")}
        />
        <Field label="Source of funds" value={record.source_of_funds} />
        <BoolField label="PEP status" value={record.pep_status} />
        <BoolField label="Sanctions match" value={record.sanctions_screening_match} />
        <BoolField label="Adverse media" value={record.adverse_media_flag} />
        <Field label="KYC status" value={record.kyc_status} />
        <Field label="ID verification date" value={record.id_verification_date} />
        <Field label="Relationship manager" value={record.relationship_manager || "—"} />
        <BoolField label="Documentation complete" value={record.documentation_complete} />
      </div>
    </div>
  );
}
