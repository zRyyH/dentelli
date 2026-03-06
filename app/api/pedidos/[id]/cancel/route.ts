import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const { id: pedidoId } = await params;

  // Valida que o pedido pertence ao usuário e está PENDENTE
  const pedidoRes = await pbFetch(`/api/collections/pedido/records/${pedidoId}`);
  if (!pedidoRes.ok) return apiError("Pedido não encontrado", 404);
  const pedido = await pedidoRes.json();
  if (pedido.usuario !== userId) return apiError("Acesso negado", 403);
  if (pedido.status !== "PENDENTE") return apiError("Apenas pedidos pendentes podem ser cancelados", 400);

  const res = await pbFetch(`/api/collections/pedido/records/${pedidoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CANCELADO" }),
  });
  if (!res.ok) return apiError("Erro ao cancelar pedido");

  return NextResponse.json({ ok: true });
}
