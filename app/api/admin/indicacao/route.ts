import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const { nome, telefone, relacaoId, embaixadorId, coletorId, valido } = body;

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

  return NextResponse.json({ ok: true, indicacao: indicacaoRecord });
});
