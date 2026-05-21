"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuditPanel } from "@/components/AuditPanel";
import { Header } from "@/components/Header";
import { IntakeForm } from "@/components/IntakeForm";
import { KpiBar } from "@/components/KpiBar";
import { RecordDetail } from "@/components/RecordDetail";
import { RecordList } from "@/components/RecordList";
import { getAuditSummary, getFormOptions, getRecords } from "@/lib/api";
import type { AuditSummary, FormOptions, OnboardingRecord } from "@/lib/types";

type Tab = "records" | "intake" | "audit";

export default function Home() {
  const [tab, setTab] = useState<Tab>("records");
  const [allRecords, setAllRecords] = useState<OnboardingRecord[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState("");
  const [findingsOnly, setFindingsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const records = useMemo(() => {
    let list = allRecords;
    if (branchFilter) list = list.filter((r) => r.branch === branchFilter);
    if (findingsOnly) list = list.filter((r) => r.audit_findings.length > 0);
    return list;
  }, [allRecords, branchFilter, findingsOnly]);

  const refresh = useCallback(async () => {
    try {
      const [recs, sum, opts] = await Promise.all([
        getRecords(),
        getAuditSummary(),
        getFormOptions(),
      ]);
      setAllRecords(recs);
      setSummary(sum);
      setOptions(opts);
      setApiError(null);
    } catch (e) {
      setApiError(
        e instanceof Error
          ? e.message
          : "Cannot reach API — start the FastAPI server on port 8000"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (records.length && !records.some((r) => r.client_id === selectedId)) {
      setSelectedId(records[0]?.client_id ?? null);
    }
  }, [records, selectedId]);

  const selected = records.find((r) => r.client_id === selectedId) ?? null;

  return (
    <>
      <Header activeTab={tab} onTabChange={setTab} />
      <main style={{ padding: "var(--padding)", maxWidth: 1280, margin: "0 auto" }}>
        {apiError && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              border: "1px solid var(--error)",
              color: "var(--error)",
            }}
          >
            {apiError}
          </div>
        )}

        {loading && !apiError ? (
          <p style={{ color: "var(--neutral)" }}>Loading onboarding data…</p>
        ) : (
          <>
            {tab === "records" && (
              <>
                <KpiBar summary={summary} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(280px, 340px) 1fr",
                    gap: 16,
                    height: "calc(100vh - 240px)",
                    minHeight: 400,
                    maxHeight: 640,
                    alignItems: "stretch",
                  }}
                >
                  <RecordList
                    records={records}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    branchFilter={branchFilter}
                    onBranchFilter={setBranchFilter}
                    findingsOnly={findingsOnly}
                    onFindingsOnly={setFindingsOnly}
                    branches={options?.branches ?? []}
                  />
                  <RecordDetail record={selected} />
                </div>
              </>
            )}

            {tab === "intake" && (
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <IntakeForm options={options} onSaved={refresh} />
              </div>
            )}

            {tab === "audit" && (
              <AuditPanel summary={summary} records={allRecords} />
            )}
          </>
        )}
      </main>
    </>
  );
}
