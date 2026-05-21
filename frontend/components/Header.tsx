"use client";

type Tab = "records" | "intake" | "audit";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "records", label: "Records" },
    { id: "intake", label: "New Assessment" },
    { id: "audit", label: "Audit View" },
  ];

  return (
    <header
      style={{
        background: "var(--primary)",
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
          <span style={{ color: "#fff" }}>Halcyon</span>{" "}
          <span style={{ fontWeight: 400 }}>Capital Partners</span>
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
          SENTINEL Onboarding
        </div>
      </div>
      <nav style={{ display: "flex", gap: 8 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            style={{
              background:
                activeTab === t.id ? "rgba(255,255,255,0.2)" : "transparent",
              color: "#fff",
              border:
                activeTab === t.id
                  ? "2px solid rgba(255,255,255,0.5)"
                  : "2px solid transparent",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
