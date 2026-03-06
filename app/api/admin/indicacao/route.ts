import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError, fireWebhooks } from "@/lib/pb-server";

export async function POST(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const { nome, telefone, relacaoId, embaixadorId, coletorId, valido, coletor, embaixador, relacao, unidade } = body;

  const res = await pbFetch("/api/collections/indicacao/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome,
      telefone,
      relacao: relacaoId,
      usuario_embaixador: embaixadorId,
      usuario_coletor: coletorId,
      valido: valido === "sim" || valido === true,
    }),
  });
  if (!res.ok) return apiError("Falha ao cadastrar indicação");
  const indicacaoRecord = await res.json();

  await fireWebhooks("INDICACAO", { indicacao: indicacaoRecord, coletor, embaixador, relacao, unidade });

  return NextResponse.json({ ok: true, indicacao: indicacaoRecord });
}
