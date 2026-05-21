"use client";

import { useCallback, useEffect, useState } from "react";
import { classifyRisk, createRecord } from "@/lib/api";
import type { ClassifyResponse, ClientType, FormOptions } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";

interface IntakeFormProps {
  options: FormOptions | null;
  onSaved: () => void;
}

const EMPTY = {
  branch: "Canary Wharf",
  client_name: "",
  client_type: "INDIVIDUAL" as ClientType,
  country_of_tax_residence: "United Kingdom",
  annual_income: "",
  source_of_funds: "Employment",
  pep_status: false,
  sanctions_screening_match: false,
  adverse_media_flag: false,
  relationship_manager: "",
  id_verification_date: new Date().toISOString().slice(0, 10),
  documentation_complete: false,
};

export function IntakeForm({ options, onSaved }: IntakeFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [classification, setClassification] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const runClassify = useCallback(async () => {
    const income = parseFloat(form.annual_income.replace(/,/g, "")) || 0;
    try {
      const result = await classifyRisk({
        client_type: form.client_type,
        country_of_tax_residence: form.country_of_tax_residence,
        annual_income: income,
        source_of_funds: form.source_of_funds,
        pep_status: form.pep_status,
        sanctions_screening_match: form.sanctions_screening_match,
        adverse_media_flag: form.adverse_media_flag,
      });
      setClassification(result);
      setError(null);
    } catch {
      setClassification(null);
    }
  }, [form]);

  useEffect(() => {
    const t = setTimeout(runClassify, 300);
    return () => clearTimeout(t);
  }, [runClassify]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const income = parseFloat(form.annual_income.replace(/,/g, "")) || 0;
      const record = await createRecord({
        branch: form.branch,
        client_name: form.client_name,
        client_type: form.client_type,
        country_of_tax_residence: form.country_of_tax_residence,
        annual_income: income,
        source_of_funds: form.source_of_funds,
        pep_status: form.pep_status,
        sanctions_screening_match: form.sanctions_screening_match,
        adverse_media_flag: form.adverse_media_flag,
        kyc_status:
          classification?.requires_edd ? "ENHANCED_DUE_DILIGENCE" : "PENDING",
        id_verification_date: form.id_verification_date,
        relationship_manager: form.relationship_manager,
        documentation_complete: form.documentation_complete,
      });
      setSuccess(`Assessment saved: ${record.client_id}`);
      setForm({ ...EMPTY, branch: form.branch, relationship_manager: form.relationship_manager });
      setClassification(null);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const branches = options?.branches ?? ["Canary Wharf"];
  const sources = options?.source_of_funds ?? [];

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>New client assessment</h2>
      <p style={{ color: "var(--neutral)", fontSize: 13, marginBottom: 16 }}>
        Complete at point of intake — risk tier is computed automatically from regulatory criteria.
      </p>

      {classification && (
        <div
          style={{
            background: "rgba(27,42,74,0.06)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Computed risk tier</span>
            <RiskBadge tier={classification.risk_classification} />
          </div>
          {classification.triggered_rules.length > 0 ? (
            <ul style={{ margin: "8px 0", paddingLeft: 18, fontSize: 14 }}>
              {classification.triggered_rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 14, margin: 0 }}>No elevated risk triggers — standard pathway.</p>
          )}
          <p style={{ fontSize: 13, color: "var(--neutral)", marginTop: 8 }}>
            {classification.compliance_note}
          </p>
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="branch">Branch</label>
          <select
            id="branch"
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rm">Relationship manager</label>
          <input
            id="rm"
            required
            value={form.relationship_manager}
            onChange={(e) => update("relationship_manager", e.target.value)}
            placeholder="e.g. S. Beaumont"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="name">Client name</label>
          <input
            id="name"
            required
            value={form.client_name}
            onChange={(e) => update("client_name", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="type">Client type</label>
          <select
            id="type"
            value={form.client_type}
            onChange={(e) => update("client_type", e.target.value as ClientType)}
          >
            <option value="INDIVIDUAL">INDIVIDUAL</option>
            <option value="ENTITY">ENTITY</option>
          </select>
        </div>
        <div>
          <label htmlFor="country">Country of tax residence</label>
          <input
            id="country"
            required
            value={form.country_of_tax_residence}
            onChange={(e) => update("country_of_tax_residence", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="income">Annual income (GBP)</label>
          <input
            id="income"
            type="number"
            min={0}
            required
            value={form.annual_income}
            onChange={(e) => update("annual_income", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="source">Source of funds</label>
          <select
            id="source"
            value={form.source_of_funds}
            onChange={(e) => update("source_of_funds", e.target.value)}
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="idv">ID verification date</label>
          <input
            id="idv"
            type="date"
            required
            value={form.id_verification_date}
            onChange={(e) => update("id_verification_date", e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.pep_status}
            onChange={(e) => update("pep_status", e.target.checked)}
          />
          Politically Exposed Person (PEP)
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.sanctions_screening_match}
            onChange={(e) => update("sanctions_screening_match", e.target.checked)}
          />
          Sanctions screening match
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.adverse_media_flag}
            onChange={(e) => update("adverse_media_flag", e.target.checked)}
          />
          Adverse media flag
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={form.documentation_complete}
            onChange={(e) => update("documentation_complete", e.target.checked)}
          />
          All required documentation collected
        </label>
      </div>

      {error && (
        <p style={{ color: "var(--error)", marginTop: 16, fontWeight: 500 }}>{error}</p>
      )}
      {success && (
        <p style={{ color: "var(--success)", marginTop: 16, fontWeight: 500 }}>{success}</p>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{ marginTop: 20, width: "100%", maxWidth: 320 }}
      >
        {loading ? "Saving…" : "Save assessment"}
      </button>
    </form>
  );
}
