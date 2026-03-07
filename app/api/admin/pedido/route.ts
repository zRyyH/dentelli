import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const { embaixadorId, lines, totalPontos, observacao, saldo } = body;

  if (!embaixadorId || !lines?.length) return apiError("Dados inválidos", 400);

  if (totalPontos > saldo) return apiError("Saldo insuficiente para este pedido", 400);

  const itemIds: string[] = [];
  for (const line of lines) {
    const res = await pbFetch("/api/collections/item/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produto: line.produtoId, quantidade: line.quantidade, pontos: line.pontosPorUnidade }),
    });
    if (!res.ok) return apiError(`Falha ao criar item: ${line.produtoNome}`);
    itemIds.push((await res.json()).id);
  }

  const pedidoRes = await pbFetch("/api/collections/pedido/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: embaixadorId, item: itemIds, pontos: totalPontos, status: "PENDENTE", observacao }),
  });
  if (!pedidoRes.ok) {
    const err = await pedidoRes.json().catch(() => ({}));
    return apiError((err as any)?.message || "Falha ao criar pedido");
  }
  const pedidoRecord = await pedidoRes.json();

  return NextResponse.json({ ok: true, pedido: pedidoRecord });
});
