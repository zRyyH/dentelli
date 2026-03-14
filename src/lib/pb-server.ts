import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export const PB_BASE_URL = "https://pbdentelli.awpsoft.com.br";

// ── Token helpers ─────────────────────────────────────────────────────────────

export async function getPbToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("pb_token")?.value ?? null;
}

export function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.id as string) || null;
  } catch {
    return null;
  }
}

// ── PocketBase fetch ──────────────────────────────────────────────────────────

export async function pbFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getPbToken();
  return fetch(`${PB_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ── Superuser token (cached in memory per process) ────────────────────────────

let _adminToken: string | null = null;
let _adminTokenExp = 0;

export async function getAdminToken(): Promise<string> {
  if (_adminToken && Date.now() < _adminTokenExp) return _adminToken;

  const res = await fetch(`${PB_BASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: process.env.PB_ADMIN_EMAIL,
      password: process.env.PB_ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error("Falha ao autenticar superusuário");
  const data = await res.json();
  _adminToken = data.token as string;
  // Renova 5 min antes de expirar (token PB dura 1 dia por padrão)
  _adminTokenExp = Date.now() + 23 * 60 * 60 * 1000;
  return _adminToken;
}

export async function pbAdminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAdminToken();
  return fetch(`${PB_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function requireAuth(token: string | null): token is string {
  return token !== null;
}

