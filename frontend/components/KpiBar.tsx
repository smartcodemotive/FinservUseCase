import type { AuditSummary } from "@/lib/types";

interface KpiBarProps {
  summary: AuditSummary | null;
}

export function KpiBar({ summary }: KpiBarProps) {
  if (!summary) return null;

  const items = [
    { label: "Total clients", value: summary.total_records },
    { label: "Audit findings", value: summary.records_with_findings },
    { label: "Risk mismatches", value: summary.risk_mismatches },
    { label: "High risk", value: summary.high_risk_count },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {items.map((item) => (
        <div key={item.label} className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: "var(--neutral)", marginBottom: 4 }}>
            {item.label}
          </div>
          <div className="kpi-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
