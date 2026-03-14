import { NextRequest, NextResponse } from "next/server";
import { pbAdminFetch } from "./pb-server";

type Handler = (request: NextRequest, context?: any) => Promise<NextResponse>;

// Cache da URL do webhook do tema (1 min)
let cachedUrl = "";
let cachedAt = 0;

async function getWebhookUrl(): Promise<string | null> {
  if (Date.now() - cachedAt < 60_000) return cachedUrl || null;
  try {
    const res = await pbAdminFetch(`/api/collections/tema/records?perPage=1`);
    if (!res.ok) return null;
    cachedUrl = (await res.json()).items?.[0]?.webhook ?? "";
    cachedAt = Date.now();
    return cachedUrl || null;
  } catch {
    return null;
  }
}

const SENSITIVE_KEYS = ["password", "passwordConfirm", "senha", "tokenKey"];

function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const clean = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of SENSITIVE_KEYS) {
    if (key in clean) clean[key] = "***";
  }
  return clean;
}

function deriveEvento(pathname: string, method: string): string {
  let ev = pathname
    .replace(/^\/api\//, "")
    .replace(/\/[a-z0-9]{15}/g, "")
    .replace(/\/$/, "")
    .replace(/\//g, "_")
    .toUpperCase();
  if (method === "PATCH") ev += "_PATCH";
  if (method === "DELETE") ev += "_DELETE";
  return ev;
}

export function withWebhook(handler: Handler): Handler {
  return async (request: NextRequest, context?: any) => {
    const method = request.method;
    const pathname = request.nextUrl.pathname;

    // Clona request para ler body sem consumir
    let requestBody: any = null;
    if (method !== "GET" && method !== "HEAD") {
      try { requestBody = await request.clone().json(); } catch {}
    }

    const response = await handler(request, context);

    // Só dispara webhook para respostas de sucesso
    if (response.status >= 400) return response;

    // Clona response para ler body
    let responseData: any = null;
    try { responseData = await response.clone().json(); } catch {}

    // Extrai usuario do token JWT no cookie
    let usuarioId: string | null = null;
    const token = request.cookies.get("pb_token")?.value;
    if (token) {
      try { usuarioId = JSON.parse(atob(token.split(".")[1])).id || null; } catch {}
    }

    // Dispara webhook em background
    getWebhookUrl().then((url) => {
      if (!url) return;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: deriveEvento(pathname, method),
          metodo: method,
          rota: pathname,
          timestamp: new Date().toISOString(),
          usuario_id: usuarioId,
          request: sanitize(requestBody),
          response: sanitize(responseData),
        }),
      }).catch(() => {});
    });

    return response;
  };
}
