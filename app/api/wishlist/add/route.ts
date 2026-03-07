import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const { produtoId } = await request.json();

  const res = await pbFetch(`/api/collections/desejo/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ produto: produtoId, usuario: userId }),
  });
  if (!res.ok) return apiError("Falha ao adicionar à lista de desejos");

  return NextResponse.json(await res.json());
});
