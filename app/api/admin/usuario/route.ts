import { NextRequest, NextResponse } from "next/server";
import { pbFetch, pbAdminFetch, getPbToken, getUserIdFromToken, apiError, getAdminProfile } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const requesterId = getUserIdFromToken(token);
  if (!requesterId) return apiError("Token inválido", 401);

  const body = await request.json();
  const {
    unidadeIds, nome, email, senha, prontuario, tipo, sexo,
    telefone, nascimento, cpf, observacao,
    isAdministrador, isColetor, isEmbaixador,
    nivelInicianteId,
  } = body;

  if (!Array.isArray(unidadeIds) || !unidadeIds.length) return apiError("Selecione ao menos uma unidade", 400);

  // Admin só pode cadastrar em suas próprias unidades
  const { unidades: adminUnidades, isDono } = await getAdminProfile(requesterId);
  if (!isDono) {
    const invalid = unidadeIds.filter((id: string) => !adminUnidades.includes(id));
    if (invalid.length) return apiError("Sem permissão para uma ou mais unidades selecionadas", 403);
  }

  // Apenas donos podem definir administrador=true
  if (isAdministrador) {
    const requesterRes = await pbAdminFetch(`/api/collections/usuario/records/${requesterId}?fields=dono`);
    const requester = requesterRes.ok ? await requesterRes.json() : null;
    if (!requester?.dono) return apiError("Sem permissão para cadastrar administradores", 403);
  }

  const usuarioBody: any = {
    unidade: unidadeIds,
    nome, email, telefone,
    administrador: !!isAdministrador,
    coletor: !!isColetor,
    embaixador: !!isEmbaixador,
    password: senha,
    passwordConfirm: senha,
    saldo: 0,
    emailVisibility: true,
    verified: true,
    nivel: nivelInicianteId,
  };
  if (prontuario !== undefined) usuarioBody.prontuario = prontuario;
  if (tipo !== undefined) usuarioBody.tipo = tipo;
  if (sexo !== undefined) usuarioBody.sexo = sexo;
  if (observacao !== undefined) usuarioBody.observacao = observacao;
  if (cpf !== undefined) usuarioBody.cpf = cpf?.replace(/\D/g, "") || "";
  if (nascimento) usuarioBody.nascimento = nascimento;

  const res = await pbFetch("/api/collections/usuario/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuarioBody),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any)?.message || "Falha ao cadastrar usuário", data: (err as any)?.data }, { status: 400 });
  }
  const usuarioRecord = await res.json();
  const { password: _p, passwordConfirm: _pc, tokenKey: _tk, ...usuarioSafe } = usuarioRecord;

  return NextResponse.json({ ok: true, usuario: usuarioSafe });
});
