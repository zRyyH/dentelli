import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const { tipo, unidadeId, produtoId, quantidade, nomeLote, custoUnitario, observacao } = body;

  if (tipo === "SAIDA") {
    const filter = encodeURIComponent(`unidade_id='${unidadeId}' && produto_id='${produtoId}'`);
    const estoqueRes = await pbFetch(`/api/collections/estoque/records?filter=${filter}&perPage=1`);
    if (!estoqueRes.ok) return apiError("Erro ao verificar estoque");
    const estoqueData = await estoqueRes.json();
    const estoqueAtual: number = estoqueData.items?.[0]?.quantidade ?? 0;
    if (quantidade > estoqueAtual) {
      return apiError(`Estoque insuficiente. Disponível: ${estoqueAtual}`, 400);
    }
  }

  const fluxoBody: any = {
    tipo,
    unidade: unidadeId,
    produto: produtoId,
    quantidade,
  };
  if (tipo === "ENTRADA") {
    fluxoBody.observacao = nomeLote;
    fluxoBody.custo_unitario = typeof custoUnitario === "string"
      ? parseFloat(custoUnitario.replace(/\./g, "").replace(",", ".")) || 0
      : custoUnitario;
  } else {
    fluxoBody.observacao = observacao;
    fluxoBody.status = "PENDENTE";
  }

  const res = await pbFetch("/api/collections/fluxo/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fluxoBody),
  });
  if (!res.ok) return apiError("Erro ao cadastrar movimentação");
  const fluxoRecord = await res.json();

  return NextResponse.json({ ok: true, fluxo: fluxoRecord });
});
