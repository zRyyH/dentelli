import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export async function GET(_request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const res = await pbFetch(`/api/collections/usuario/records/${userId}`);
  if (!res.ok) return apiError("Falha ao buscar perfil");
  return NextResponse.json(await res.json());
}

export const PATCH = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const body = await request.json();

  // Nunca permitir que o cliente altere campos sensíveis de role
  const { administrador: _a, superuser: _s, embaixador: _e, coletor: _c, ...safeBody } = body;

  const res = await pbFetch(`/api/collections/usuario/records/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(safeBody),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return apiError((err as any)?.message || "Erro ao salvar", 400);
  }

  return NextResponse.json(await res.json());
});
