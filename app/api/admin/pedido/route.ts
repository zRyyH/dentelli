import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError, requireAdminUnidade, getSaldoReal } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const adminId = getUserIdFromToken(token);
  if (!adminId) return apiError("Token inválido", 401);

  const body = await request.json();
  const { embaixadorId, unidadeId, lines, observacao } = body;

  if (!embaixadorId || !unidadeId || !lines?.length) return apiError("Campos obrigatórios: embaixadorId, unidadeId, lines", 400);

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

  // Busca dados reais dos produtos e valida estoque
  let totalPontos = 0;
  const linhasValidadas: { produtoId: string; produtoNome: string; quantidade: number; pontos: number }[] = [];

  for (const line of lines) {
    const { produtoId, quantidade } = line;
    if (!produtoId || !quantidade || quantidade < 1) return apiError("Linha inválida no pedido", 400);

    // Busca produto para obter pontos reais
    const prodRes = await pbFetch(`/api/collections/produto/records/${produtoId}?fields=nome,pontos`);
    if (!prodRes.ok) return apiError(`Produto ${produtoId} não encontrado`, 404);
    const prod = await prodRes.json();

    // Valida estoque real
    const filter = encodeURIComponent(`unidade_id='${unidadeId}' && produto_id='${produtoId}'`);
    const estoqueRes = await pbFetch(`/api/collections/estoque/records?filter=${filter}&perPage=1&fields=quantidade`);
    if (!estoqueRes.ok) return apiError("Erro ao verificar estoque");
    const estoqueData = await estoqueRes.json();
    const estoqueAtual: number = estoqueData.items?.[0]?.quantidade ?? 0;
    if (quantidade > estoqueAtual) return apiError(`Estoque insuficiente para "${prod.nome}". Disponível: ${estoqueAtual}`, 400);

    const pontosProduto = prod.pontos ?? 0;
    totalPontos += pontosProduto * quantidade;
    linhasValidadas.push({ produtoId, produtoNome: prod.nome, quantidade, pontos: pontosProduto });
  }

  // Saldo real do embaixador — não confia no frontend
  const saldoReal = await getSaldoReal(embaixadorId, unidadeId);
  if (totalPontos > saldoReal) return apiError(`Saldo insuficiente. Disponível: ${saldoReal}, necessário: ${totalPontos}`, 400);

  // Cria itens do pedido
  const itemIds: string[] = [];
  for (const line of linhasValidadas) {
    const res = await pbFetch("/api/collections/item/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produto: line.produtoId, quantidade: line.quantidade, pontos: line.pontos }),
    });
    if (!res.ok) return apiError(`Falha ao criar item: ${line.produtoNome}`);
    itemIds.push((await res.json()).id);
  }

  // Cria pedido
  const pedidoRes = await pbFetch("/api/collections/pedido/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: embaixadorId, unidade: unidadeId, item: itemIds, pontos: totalPontos, status: "PENDENTE", observacao: observacao || "" }),
  });
  if (!pedidoRes.ok) {
    const err = await pedidoRes.json().catch(() => ({}));
    return apiError((err as any)?.message || "Falha ao criar pedido");
  }

  return NextResponse.json({ ok: true, pedido: await pedidoRes.json() });
});
