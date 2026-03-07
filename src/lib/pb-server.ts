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

// ── Response helpers ──────────────────────────────────────────────────────────

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function requireAuth(token: string | null): token is string {
  return token !== null;
}

