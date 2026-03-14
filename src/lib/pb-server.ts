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
  return pbAdminFetch(path, options);
}

// ── Superuser token (cached in memory per process) ────────────────────────────

let _adminToken: string | null = null;
let _adminTokenExp = 0;
let _adminTokenPromise: Promise<string> | null = null;

function getTokenExpMs(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds; refresh 5 min before expiry
    return payload.exp ? payload.exp * 1000 - 5 * 60 * 1000 : Date.now() + 23 * 60 * 60 * 1000;
  } catch {
    return Date.now() + 23 * 60 * 60 * 1000;
  }
}

export async function getAdminToken(): Promise<string> {
  if (_adminToken && Date.now() < _adminTokenExp) return _adminToken;

  // Evita múltiplas autenticações simultâneas (race condition)
  if (!_adminTokenPromise) {
    _adminTokenPromise = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const res = await fetch(`${PB_BASE_URL}/api/collections/_superusers/auth-with-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identity: process.env.PB_ADMIN_EMAIL,
            password: process.env.PB_ADMIN_PASSWORD,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          _adminToken = data.token as string;
          _adminTokenExp = getTokenExpMs(_adminToken);
          return _adminToken;
        }

        const errBody = await res.json().catch(() => ({}));
        console.error(`[pb-server] getAdminToken tentativa ${attempt}/3 falhou:`, res.status, errBody);

        // 429 → wait longer before retry
        const delay = res.status === 429 ? attempt * 3000 : attempt * 500;
        if (attempt < 3) await new Promise((r) => setTimeout(r, delay));
      }
      throw new Error("Falha ao autenticar superusuário após 3 tentativas");
    })().finally(() => { _adminTokenPromise = null; });
  }

  return _adminTokenPromise;
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

// ── Domain helpers ────────────────────────────────────────────────────────────

interface AdminProfile { unidades: string[]; isDono: boolean; }

/** Retorna as unidades e se é dono do usuário informado. */
export async function getAdminProfile(userId: string): Promise<AdminProfile> {
  const res = await pbFetch(`/api/collections/usuario/records/${userId}?fields=unidade,dono`);
  if (!res.ok) return { unidades: [], isDono: false };
  const data = await res.json();
  const unidades = Array.isArray(data.unidade) ? data.unidade : data.unidade ? [data.unidade] : [];
  return { unidades, isDono: !!data.dono };
}

/** Compat: retorna apenas as unidades. */
export async function getUserUnidades(userId: string): Promise<string[]> {
  return (await getAdminProfile(userId)).unidades;
}

/**
 * Retorna 403 se o admin não tiver permissão para a unidade.
 * Donos têm acesso irrestrito a qualquer unidade.
 */
export async function requireAdminUnidade(adminId: string, unidadeId: string): Promise<NextResponse | null> {
  const { unidades, isDono } = await getAdminProfile(adminId);
  if (isDono) return null;
  if (!unidades.includes(unidadeId)) return apiError("Sem permissão para esta unidade", 403);
  return null;
}

/** Busca o saldo real de um embaixador em uma unidade diretamente no banco. */
export async function getSaldoReal(usuarioId: string, unidadeId: string): Promise<number> {
  const filter = encodeURIComponent(`usuario='${usuarioId}' && unidade='${unidadeId}'`);
  const res = await pbFetch(`/api/collections/saldo/records?filter=${filter}&perPage=1&fields=saldo,pendente`);
  if (!res.ok) return 0;
  const data = await res.json();
  const record = data.items?.[0];
  if (!record) return 0;
  return record.saldo ?? 0;
}

