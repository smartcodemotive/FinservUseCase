"use client";

import { RiskBadge } from "./RiskBadge";
import type { OnboardingRecord } from "@/lib/types";

interface RecordListProps {
  records: OnboardingRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  branchFilter: string;
  onBranchFilter: (b: string) => void;
  findingsOnly: boolean;
  onFindingsOnly: (v: boolean) => void;
  branches: string[];
}

export function RecordList({
  records,
  selectedId,
  onSelect,
  branchFilter,
  onBranchFilter,
  findingsOnly,
  onFindingsOnly,
  branches,
}: RecordListProps) {
  return (
    <div
      className="card record-list-panel"
      style={{
        padding: 16,
        height: "100%",
        minHeight: 0,
        maxHeight: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Onboarding records</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select
          value={branchFilter}
          onChange={(e) => onBranchFilter(e.target.value)}
          style={{ flex: 1, minWidth: 140 }}
          aria-label="Filter by branch"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="toggle-row" style={{ flex: "0 0 auto" }}>
          <input
            type="checkbox"
            checked={findingsOnly}
            onChange={(e) => onFindingsOnly(e.target.checked)}
          />
          <span style={{ fontSize: 13 }}>Findings only</span>
        </label>
      </div>
      <ul
        className="record-list-scroll"
        style={{
          listStyle: "none",
          overflowY: "auto",
          overflowX: "hidden",
          flex: "1 1 0",
          minHeight: 0,
          margin: 0,
          padding: 0,
          paddingRight: 4,
        }}
      >
        {records.map((r) => (
          <li key={r.client_id}>
            <button
              type="button"
              onClick={() => onSelect(r.client_id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                marginBottom: 6,
                borderRadius: 8,
                border:
                  selectedId === r.client_id
                    ? "2px solid var(--primary)"
                    : "1px solid #e5e7eb",
                background:
                  selectedId === r.client_id ? "rgba(27,42,74,0.06)" : "var(--card)",
                minHeight: 44,
                display: "block",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 14 }}>{r.client_name}</strong>
                <RiskBadge tier={r.computed_risk ?? r.risk_classification} />
              </div>
              <div style={{ fontSize: 12, color: "var(--neutral)", marginTop: 4 }}>
                {r.client_id} · {r.branch} · {r.onboarding_date}
              </div>
              {r.audit_findings.length > 0 && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--error)",
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {r.audit_findings.length} finding(s)
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
