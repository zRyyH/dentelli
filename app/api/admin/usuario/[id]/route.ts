import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const { id } = await params;
  const res = await pbFetch(`/api/collections/usuario/records/${id}`);
  if (!res.ok) return apiError("Usuário não encontrado", 404);
  return NextResponse.json(await res.json());
}

export const PATCH = withWebhook(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const { id: usuarioId } = await params;
  const body = await request.json();
  const {
    unidadeId, nome, prontuario, tipo, sexo,
    telefone, nascimento, cpf, observacao, email, senha,
    isAdministrador, isColetor, isEmbaixador,
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
  };
  if (nascimento) usuarioBody.nascimento = nascimento;
  if (senha) { usuarioBody.password = senha; usuarioBody.passwordConfirm = senha; }

  const res = await pbFetch(`/api/collections/usuario/records/${usuarioId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuarioBody),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return apiError((err as any)?.message || "Erro ao atualizar usuário", 400);
  }
  const usuarioRecord = await res.json();
  const { password: _p, passwordConfirm: _pc, tokenKey: _tk, ...usuarioSafe } = usuarioRecord;

  return NextResponse.json({ ok: true, usuario: usuarioSafe });
});
