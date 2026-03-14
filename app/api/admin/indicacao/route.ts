import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError, requireAdminUnidade } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const adminId = getUserIdFromToken(token);
  if (!adminId) return apiError("Token inválido", 401);

  const body = await request.json();
  const { nome, telefone, relacaoId, embaixadorId, coletorId, unidade, valido } = body;

  if (!unidade?.id) return apiError("unidadeId obrigatório", 400);

  const permErr = await requireAdminUnidade(adminId, unidade.id);
  if (permErr) return permErr;

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
  if (!res.ok) {
    const pbErr = await res.json().catch(() => ({}));
    const data = (pbErr as any)?.data ?? {};

    // Mapeia erros de campo do PocketBase para mensagens legíveis
    const fieldMessages: Record<string, string> = {
      telefone: "Telefone inválido ou já cadastrado como indicação",
      nome: "Nome inválido ou ausente",
      relacao: "Relação inválida",
      usuario_embaixador: "Embaixador inválido",
      usuario_coletor: "Coletor inválido",
    };

    const fieldErrors = Object.entries(data)
      .map(([field, err]: [string, any]) => fieldMessages[field] ?? `${field}: ${err?.message ?? "inválido"}`)
      .filter(Boolean);

    if (fieldErrors.length > 0) return apiError(fieldErrors.join(" · "), 400);

    const pbMessage = (pbErr as any)?.message;
    return apiError(pbMessage || "Falha ao cadastrar indicação", res.status);
  }
  const indicacaoRecord = await res.json();

  return NextResponse.json({ ok: true, indicacao: indicacaoRecord });
});
