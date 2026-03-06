import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError, fireWebhooks } from "@/lib/pb-server";

export async function POST(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const { embaixadorId, lines, totalPontos, observacao, embaixador, saldo } = body;

  if (!embaixadorId || !lines?.length) return apiError("Dados inválidos", 400);

  // Valida saldo
  if (totalPontos > saldo) return apiError("Saldo insuficiente para este pedido", 400);

  // Cria itens
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

  // Cria pedido
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

  await fireWebhooks("PEDIDO", {
    pedido: pedidoRecord,
    embaixador,
    itens: lines.map((l: any) => ({
      produtoId: l.produtoId,
      produtoNome: l.produtoNome,
      pontosPorUnidade: l.pontosPorUnidade,
      quantidade: l.quantidade,
      totalPontos: l.pontosPorUnidade * l.quantidade,
    })),
    totalPontos,
    saldoAntes: saldo,
    saldoApos: saldo - totalPontos,
    observacao,
  });

  return NextResponse.json({ ok: true, pedido: pedidoRecord });
}
