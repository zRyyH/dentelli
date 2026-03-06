import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError, fireWebhooks } from "@/lib/pb-server";

export async function POST(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const adminId = getUserIdFromToken(token);
  if (!adminId) return apiError("Token inválido", 401);

  const body = await request.json();
  const {
    tipo, // "CREDITO" | "DEBITO"
    embaixadorId, missaoId, pontos, observacao,
    pedidoId, custoDebito, observacaoDebito,
    // Para webhook enrichment
    embaixador, unidade, missao, pedido: pedidoData,
    saldoPontos,
  } = body;

  if (tipo === "CREDITO") {
    const res = await pbFetch("/api/collections/transacao/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "CREDITO",
        usuario: embaixadorId,
        usuario_responsavel: adminId,
        valor: pontos,
        saldo: pontos,
        missao: missaoId,
        observacao,
      }),
    });
    if (!res.ok) return apiError("Falha ao pontuar");
    const transacaoRecord = await res.json();

    await fireWebhooks("CENTRAL_DE_PONTOS", {
      tipoTransacao: "CREDITO",
      transacao: transacaoRecord,
      embaixador,
      unidade,
      missao,
    });

    return NextResponse.json({ ok: true, transacao: transacaoRecord });
  }

  if (tipo === "DEBITO") {
    const saldoApos = saldoPontos - custoDebito;
    if (saldoApos < 0) return apiError("Saldo insuficiente para este resgate", 400);

    const res = await pbFetch("/api/collections/transacao/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "DEBITO",
        usuario: embaixadorId,
        usuario_responsavel: adminId,
        pedido: pedidoId,
        valor: custoDebito,
        observacao: observacaoDebito,
      }),
    });
    if (!res.ok) return apiError("Falha ao registrar resgate");
    const transacaoRecord = await res.json();

    await pbFetch(`/api/collections/pedido/records/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDO" }),
    });

    await fireWebhooks("CENTRAL_DE_PONTOS", {
      tipoTransacao: "DEBITO",
      transacao: transacaoRecord,
      embaixador,
      unidade,
      pedido: pedidoData,
      saldoAntes: saldoPontos,
      saldoApos,
    });

    return NextResponse.json({ ok: true, transacao: transacaoRecord });
  }

  return apiError("Tipo inválido", 400);
}
