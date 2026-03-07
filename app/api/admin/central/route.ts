import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const adminId = getUserIdFromToken(token);
  if (!adminId) return apiError("Token inválido", 401);

  const body = await request.json();
  const {
    tipo, // "CREDITO" | "DEBITO"
    embaixadorId, missaoId, indicacaoId, pontos, observacao,
    pedidoId, custoDebito, observacaoDebito,
    saldoPontos,
  } = body;

  if (tipo === "CREDITO") {
    // Buscar missão para verificar categoria
    if (missaoId) {
      const missaoRes = await pbFetch(`/api/collections/missao/records/${missaoId}`);
      if (missaoRes.ok) {
        const missao = await missaoRes.json();
        if (missao.categoria === "INDICACAO" && !indicacaoId) {
          return apiError("Indicação obrigatória para missões da categoria INDICACAO", 400);
        }
      }
    }

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
        indicacao: indicacaoId || "",
        observacao,
      }),
    });
    if (!res.ok) return apiError("Falha ao pontuar");
    const transacaoRecord = await res.json();

    return NextResponse.json({ ok: true, transacao: transacaoRecord });
  }

  if (tipo === "DEBITO") {
    const saldoApos = saldoPontos - custoDebito;
    if (saldoApos < 0) return apiError("Saldo insuficiente para este resgate", 400);

    // Buscar unidade do embaixador
    const embaixadorRes = await pbFetch(`/api/collections/usuario/records/${embaixadorId}`);
    if (!embaixadorRes.ok) return apiError("Falha ao buscar embaixador");
    const embaixadorRecord = await embaixadorRes.json();
    const unidadeId: string = embaixadorRecord.unidade;

    // Buscar pedido para obter os itens
    const pedidoRes = await pbFetch(`/api/collections/pedido/records/${pedidoId}`);
    if (!pedidoRes.ok) return apiError("Falha ao buscar pedido");
    const pedidoRecord = await pedidoRes.json();
    const itemIds: string[] = Array.isArray(pedidoRecord.item) ? pedidoRecord.item : [];

    // Buscar registros dos itens
    const itemRecords: { produto: string; quantidade: number }[] = [];
    await Promise.all(
      itemIds.map(async (itemId) => {
        const itemRes = await pbFetch(`/api/collections/item/records/${itemId}`);
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          itemRecords.push({ produto: itemData.produto, quantidade: itemData.quantidade });
        }
      })
    );

    // Criar transação de débito
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

    // Marcar pedido como concluído
    await pbFetch(`/api/collections/pedido/records/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDO" }),
    });

    // Registrar saída no fluxo para cada item do pedido
    if (unidadeId && itemRecords.length > 0) {
      await Promise.all(
        itemRecords.map((item) =>
          pbFetch("/api/collections/fluxo/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: "SAIDA",
              produto: item.produto,
              quantidade: item.quantidade,
              unidade: unidadeId,
              pedido: pedidoId,
              observacao: "Resgate",
              custo_unitario: 0,
            }),
          })
        )
      );
    }

    return NextResponse.json({ ok: true, transacao: transacaoRecord });
  }

  return apiError("Tipo inválido", 400);
});
