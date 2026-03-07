import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export const POST = withWebhook(async (request: NextRequest) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const body = await request.json();
  const {
    unidadeId, nome, email, senha, prontuario, tipo, sexo,
    telefone, nascimento, cpf, observacao,
    isAdministrador, isColetor, isEmbaixador,
    nivelInicianteId,
  } = body;

  const usuarioBody: any = {
    unidade: unidadeId,
    nome,
    prontuario,
    tipo,
    sexo,
    telefone,
    cpf: cpf?.replace(/\D/g, "") || "",
    observacao,
    email,
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
  if (nascimento) usuarioBody.nascimento = nascimento;

  const res = await pbFetch("/api/collections/usuario/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuarioBody),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return apiError((err as any)?.message || "Falha ao cadastrar usuário", 400);
  }
  const usuarioRecord = await res.json();
  const { password: _p, passwordConfirm: _pc, tokenKey: _tk, ...usuarioSafe } = usuarioRecord;

  return NextResponse.json({ ok: true, usuario: usuarioSafe });
});
