export const PB_BASE_URL = "https://pbdentelli.awpsoft.com.br";

const TOKEN_COOKIE = "pb_token";
const USER_KEY = "pb_user";
const UNIDADE_KEY = "pb_unidade";

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)pb_token=([^;]*)/);
  return match?.[1] || null;
}

export function removeAuthCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  clearUserData();
}

// ── User data (localStorage) ──────────────────────────────────────────────────

export function setUserData(record: Record<string, unknown>) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(record)); } catch {}
}

export function getUserData(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getUserId(): string | null {
  return (getUserData()?.id as string) || null;
}

export function clearUserData() {
  try { localStorage.removeItem(USER_KEY); } catch {}
}

export function getSelectedUnidade(): string | null {
  try { return localStorage.getItem(UNIDADE_KEY); } catch { return null; }
}

export function setSelectedUnidade(id: string) {
  try { localStorage.setItem(UNIDADE_KEY, id); } catch {}
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function hasRole(role: "embaixador" | "coletor" | "superuser" | "administrador"): boolean {
  const user = getUserData();
  return !!user?.[role];
}

export function canAccessAdminMenus(): boolean {
  return hasRole("superuser") || hasRole("administrador");
}

export function isDono(): boolean {
  return !!(getUserData()?.dono);
}

// ── Fetch with auth ───────────────────────────────────────────────────────────

export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ── Auth actions ──────────────────────────────────────────────────────────────

export async function loginWithPassword(email: string, password: string) {
  const res = await fetch(`${PB_BASE_URL}/api/collections/usuario/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as any)?.message || "Falha na autenticação");
  }

  const data = await res.json();
  setAuthCookie(data.token);
  setUserData(data.record);
  return data;
}
