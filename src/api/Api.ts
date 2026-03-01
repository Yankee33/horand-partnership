const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Token helpers ─────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem("token");
export const setToken = (token: string) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// ── Base fetch ────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Multipart (для фото) ──────────────────────────────
async function upload(path: string, formData: FormData): Promise<{ photo_url: string }> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────
export interface UserOut {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
}

export interface CoOwnerOut {
  id: number;
  full_name: string;
  share: number;
  photo_url: string | null;
  position: number;
}

export interface IncomeRuleOut {
  id: number;
  co_owner_id: number;
  income_type: "project" | "clients" | "profit";
  share: number;
}

export interface CompanyOut {
  id: number;
  name: string;
  entity_type: "company" | "project";
  contract_confirmed: boolean;
  created_at: string;
  co_owners: CoOwnerOut[];
  income_rules: IncomeRuleOut[];
}

// ── Auth API ──────────────────────────────────────────
export const authApi = {
register: (data: { full_name: string; email: string; password: string }) =>
    request<UserOut>("/api/auth/register", {  // було /register
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<UserOut>("/api/auth/me"),
};

// ── Companies API ─────────────────────────────────────
export const companiesApi = {
  list: () => request<CompanyOut[]>("/api/companies/"),

  create: (data: {
    name: string;
    entity_type: "company" | "project";
    co_owners: { full_name: string; share: number; position: number }[];
    income_rules: { co_owner_id: number; income_type: string; share: number }[];
  }) =>
    request<CompanyOut>("/api/companies/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: number) => request<CompanyOut>(`/api/companies/${id}`),

  update: (id: number, data: Partial<{ name: string; entity_type: string; contract_confirmed: boolean }>) =>
    request<CompanyOut>(`/api/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/api/companies/${id}`, { method: "DELETE" }),

  uploadPhoto: (companyId: number, coOwnerId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return upload(`/api/companies/${companyId}/co-owners/${coOwnerId}/photo`, form);
  },

  updateIncomeRules: (
    companyId: number,
    rules: { co_owner_id: number; income_type: string; share: number }[]
  ) =>
    request<CompanyOut>(`/api/companies/${companyId}/income-rules`, {
      method: "PUT",
      body: JSON.stringify(rules),
    }),
};