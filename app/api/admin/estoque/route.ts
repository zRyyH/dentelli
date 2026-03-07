import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const { tipo, unidadeId, produtoId, quantidade, nomeLote, custoUnitario, observacao } = body;

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
