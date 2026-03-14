import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const { pedidoId } = await request.json();

  // Valida que o pedido pertence ao usuário autenticado
  const pedidoRes = await pbFetch(`/api/collections/pedido/records/${pedidoId}`);
  if (!pedidoRes.ok) return apiError("Pedido não encontrado", 404);
  const pedido = await pedidoRes.json();
  if (pedido.usuario !== userId) return apiError("Acesso negado", 403);
  if (pedido.status !== "CARRINHO") return apiError("Pedido inválido", 400);

  // Valida saldo do usuário pela unidade do pedido
  const unidadeFilter = pedido.unidade ? ` && unidade='${pedido.unidade}'` : "";
  const saldoFilter = encodeURIComponent(`usuario='${userId}'${unidadeFilter}`);
  const saldoRes = await pbFetch(`/api/collections/saldo/records?filter=${saldoFilter}&perPage=1`);
  const saldoData = saldoRes.ok ? (await saldoRes.json()).items?.[0] : null;
  const saldo: number = saldoData?.saldo ?? 0;
  if (pedido.pontos > saldo) return apiError("Saldo insuficiente", 400);

  // Atualiza status para PENDENTE
  const res = await pbFetch(`/api/collections/pedido/records/${pedidoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PENDENTE" }),
  });
  if (!res.ok) return apiError("Erro ao solicitar resgate");

  return NextResponse.json({ ok: true });
});
