import type { RiskTier } from "@/lib/types";

export function RiskBadge({ tier }: { tier: RiskTier | string | null }) {
  if (!tier) return <span className="badge">—</span>;
  const cls =
    tier === "HIGH"
      ? "badge-high"
      : tier === "MEDIUM"
        ? "badge-medium"
        : "badge-low";
  return <span className={`badge ${cls}`}>{tier}</span>;
}
