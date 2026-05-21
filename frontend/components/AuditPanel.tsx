"use client";

import { RiskBadge } from "./RiskBadge";
import type { AuditSummary, OnboardingRecord } from "@/lib/types";

interface AuditPanelProps {
  summary: AuditSummary | null;
  records: OnboardingRecord[];
}

export function AuditPanel({ summary, records }: AuditPanelProps) {
  const findingRecords = records.filter((r) => r.audit_findings.length > 0);

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16, color: "var(--primary)" }}>
        Quarterly file review — audit view
      </h2>
      <p style={{ marginBottom: 16, color: "var(--neutral)" }}>
        Who assessed which client, when, and what was recorded. Findings highlight
        missing fields and risk classification mismatches from legacy paper/spreadsheet entry.
      </p>

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div className="card">
            <div style={{ fontSize: 13, color: "var(--neutral)" }}>Records with findings</div>
            <div className="kpi-value" style={{ color: "var(--error)" }}>
              {summary.records_with_findings}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, color: "var(--neutral)" }}>Risk mismatches</div>
            <div className="kpi-value" style={{ color: "var(--warning)" }}>
              {summary.risk_mismatches}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, color: "var(--neutral)" }}>Missing field records</div>
            <div className="kpi-value">{summary.missing_field_records}</div>
          </div>
          {Object.entries(summary.by_branch).map(([branch, count]) => (
            <div key={branch} className="card">
              <div style={{ fontSize: 13, color: "var(--neutral)" }}>{branch}</div>
              <div className="kpi-value">{count}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "12px 8px" }}>Client</th>
              <th style={{ padding: "12px 8px" }}>Assessed by</th>
              <th style={{ padding: "12px 8px" }}>Date</th>
              <th style={{ padding: "12px 8px" }}>Recorded</th>
              <th style={{ padding: "12px 8px" }}>Computed</th>
              <th style={{ padding: "12px 8px" }}>Findings</th>
            </tr>
          </thead>
          <tbody>
            {findingRecords.map((r) => (
              <tr key={r.client_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 8px", minWidth: 140 }}>
                  <strong>{r.client_name}</strong>
                  <div style={{ fontSize: 12, color: "var(--neutral)" }}>{r.client_id}</div>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  {r.relationship_manager || (
                    <span style={{ color: "var(--error)" }}>Missing</span>
                  )}
                </td>
                <td style={{ padding: "12px 8px" }}>{r.onboarding_date}</td>
                <td style={{ padding: "12px 8px" }}>
                  <RiskBadge tier={r.risk_classification} />
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <RiskBadge tier={r.computed_risk} />
                </td>
                <td style={{ padding: "12px 8px", maxWidth: 320 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                    {r.audit_findings.map((f, i) => (
                      <li key={i} style={{ color: "var(--error)" }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {findingRecords.length === 0 && (
          <p style={{ padding: 24, color: "var(--neutral)" }}>No audit findings in current dataset.</p>
        )}
      </div>
    </div>
  );
}
