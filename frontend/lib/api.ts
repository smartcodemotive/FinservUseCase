import type {
  AuditSummary,
  ClassifyResponse,
  FormOptions,
  OnboardingRecord,
  OnboardingRecordCreate,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : JSON.stringify(err.detail ?? err)
    );
  }
  return res.json();
}

export function getRecords(params?: {
  branch?: string;
  findings_only?: boolean;
  risk?: string;
}): Promise<OnboardingRecord[]> {
  const q = new URLSearchParams();
  if (params?.branch) q.set("branch", params.branch);
  if (params?.findings_only) q.set("findings_only", "true");
  if (params?.risk) q.set("risk", params.risk);
  const qs = q.toString();
  return fetchJson(`/api/records${qs ? `?${qs}` : ""}`);
}

export function getRecord(clientId: string): Promise<OnboardingRecord> {
  return fetchJson(`/api/records/${clientId}`);
}

export function classifyRisk(
  body: Omit<OnboardingRecordCreate, "branch" | "client_name" | "relationship_manager" | "kyc_status" | "id_verification_date" | "documentation_complete">
): Promise<ClassifyResponse> {
  return fetchJson("/api/classify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createRecord(
  body: OnboardingRecordCreate
): Promise<OnboardingRecord> {
  return fetchJson("/api/records", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getAuditSummary(): Promise<AuditSummary> {
  return fetchJson("/api/audit/summary");
}

export function getFormOptions(): Promise<FormOptions> {
  return fetchJson("/api/meta/options");
}
