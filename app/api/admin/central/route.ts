import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError, requireAdminUnidade, getSaldoReal } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const adminId = getUserIdFromToken(token);
  if (!adminId) return apiError("Token inválido", 401);

  const body = await request.json();
  const { tipo, embaixadorId, unidadeId, missaoId, indicacaoId, observacao, pedidoId, observacaoDebito } = body;

  if (!tipo || !unidadeId || !embaixadorId) return apiError("Campos obrigatórios: tipo, unidadeId, embaixadorId", 400);

  // Admin deve pertencer à unidade
  const permErr = await requireAdminUnidade(adminId, unidadeId);
  if (permErr) return permErr;

  // Embaixador deve pertencer à unidade
  const embRes = await pbFetch(`/api/collections/usuario/records/${embaixadorId}?fields=unidade,embaixador`);
  if (!embRes.ok) return apiError("Embaixador não encontrado", 404);
  const embData = await embRes.json();
  if (!embData.embaixador) return apiError("Usuário não é embaixador", 400);
  const embUnidades: string[] = Array.isArray(embData.unidade) ? embData.unidade : embData.unidade ? [embData.unidade] : [];
  if (embUnidades.length > 0 && !embUnidades.includes(unidadeId)) return apiError("Embaixador não pertence a esta unidade", 400);

  // ── CRÉDITO ───────────────────────────────────────────────────────────────
  if (tipo === "CREDITO") {
    if (!missaoId) return apiError("missaoId obrigatório", 400);

    const missaoRes = await pbFetch(`/api/collections/missao/records/${missaoId}?fields=categoria,pontos,automatico`);
    if (!missaoRes.ok) return apiError("Missão não encontrada", 404);
    const missao = await missaoRes.json();

    if (missao.automatico) return apiError("Missões automáticas não podem ser pontuadas manualmente", 400);
    if (missao.categoria === "INDICACAO" && !indicacaoId) return apiError("Indicação obrigatória para missões da categoria INDICACAO", 400);

    // Valida que a indicação pertence ao embaixador informado
    if (indicacaoId) {
      const indRes = await pbFetch(`/api/collections/indicacao/records/${indicacaoId}?fields=usuario_embaixador`);
      if (!indRes.ok) return apiError("Indicação não encontrada", 404);
      const ind = await indRes.json();
      if (ind.usuario_embaixador !== embaixadorId) return apiError("Indicação não pertence ao embaixador selecionado", 403);
    }

    const pontosFinais: number = missao.pontos ?? 0;

    const res = await pbFetch("/api/collections/transacao/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "CREDITO",
        usuario: embaixadorId,
        usuario_responsavel: adminId,
        unidade: unidadeId,
        valor: pontosFinais,
        saldo: pontosFinais,
        missao: missaoId,
        indicacao: indicacaoId || null,
        observacao: observacao || "",
      }),
    });
    if (!res.ok) {
      const pbErr = await res.json().catch(() => ({}));
      const fieldMessages: Record<string, string> = {
        usuario: "Embaixador inválido ou não encontrado",
        unidade: "Unidade inválida",
        missao: "Missão inválida",
        indicacao: "Indicação inválida ou já utilizada nesta missão",
        valor: "Valor de pontos inválido",
      };
      const data = (pbErr as any)?.data ?? {};
      const fieldErrors = Object.entries(data)
        .map(([field, err]: [string, any]) => fieldMessages[field] ?? `${field}: ${err?.message ?? "inválido"}`)
        .filter(Boolean);
      if (fieldErrors.length > 0) return apiError(fieldErrors.join(" · "), 400);
      return apiError((pbErr as any)?.message || "Falha ao pontuar", res.status);
    }
    return NextResponse.json({ ok: true, transacao: await res.json() });
  }

  // ── DÉBITO ────────────────────────────────────────────────────────────────
  if (tipo === "DEBITO") {
    if (!pedidoId) return apiError("pedidoId obrigatório", 400);

    // Busca pedido e valida que pertence ao embaixador
    const pedidoRes = await pbFetch(`/api/collections/pedido/records/${pedidoId}`);
    if (!pedidoRes.ok) return apiError("Pedido não encontrado", 404);
    const pedidoRecord = await pedidoRes.json();
    if (pedidoRecord.usuario !== embaixadorId) return apiError("Pedido não pertence ao embaixador informado", 403);
    if (pedidoRecord.status !== "PENDENTE") return apiError("Pedido não está pendente", 400);

    // Busca custo real somando pontos dos itens
    const itemIds: string[] = Array.isArray(pedidoRecord.item) ? pedidoRecord.item : [];
    const itemRecords: { produto: string; quantidade: number; pontos: number }[] = [];
    await Promise.all(itemIds.map(async (itemId) => {
      const itemRes = await pbFetch(`/api/collections/item/records/${itemId}`);
      if (itemRes.ok) itemRecords.push(await itemRes.json());
    }));
    const custoReal = itemRecords.reduce((s, i) => s + (i.pontos ?? 0) * (i.quantidade ?? 1), 0);

    // Saldo real do embaixador buscado no banco — não confia no frontend
    const saldoReal = await getSaldoReal(embaixadorId, unidadeId);
    if (saldoReal < custoReal) return apiError(`Saldo insuficiente. Disponível: ${saldoReal}, necessário: ${custoReal}`, 400);

    const res = await pbFetch("/api/collections/transacao/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "DEBITO",
        usuario: embaixadorId,
        usuario_responsavel: adminId,
        unidade: unidadeId,
        pedido: pedidoId,
        valor: custoReal,
        observacao: observacaoDebito || "",
      }),
    });
    if (!res.ok) {
      const pbErr = await res.json().catch(() => ({}));
      const fieldMessages: Record<string, string> = {
        usuario: "Embaixador inválido ou não encontrado",
        unidade: "Unidade inválida",
        pedido: "Pedido inválido",
        valor: "Valor inválido",
      };
      const data = (pbErr as any)?.data ?? {};
      const fieldErrors = Object.entries(data)
        .map(([field, err]: [string, any]) => fieldMessages[field] ?? `${field}: ${err?.message ?? "inválido"}`)
        .filter(Boolean);
      if (fieldErrors.length > 0) return apiError(fieldErrors.join(" · "), 400);
      return apiError((pbErr as any)?.message || "Falha ao registrar resgate", res.status);
    }

    await pbFetch(`/api/collections/pedido/records/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONCLUIDO" }),
    });

    if (itemRecords.length > 0) {
      await Promise.all(itemRecords.map((item) =>
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
      ));
    }

    return NextResponse.json({ ok: true, transacao: await res.json() });
  }

  return apiError("Tipo inválido", 400);
});
