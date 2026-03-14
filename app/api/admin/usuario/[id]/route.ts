import { NextRequest, NextResponse } from "next/server";
import { pbFetch, pbAdminFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";
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
  const requesterId = getUserIdFromToken(token);

  const { id: usuarioId } = await params;
  const body = await request.json();
  const {
    unidadeId, nome, prontuario, tipo, sexo,
    telefone, nascimento, cpf, observacao, email, senha,
    isAdministrador, isColetor, isEmbaixador,
  } = body;

  // Apenas donos podem ativar administrador=true em quem ainda não tem
  if (isAdministrador && requesterId) {
    const [currentRes, requesterRes] = await Promise.all([
      pbAdminFetch(`/api/collections/usuario/records/${usuarioId}`),
      pbAdminFetch(`/api/collections/usuario/records/${requesterId}`),
    ]);
    const current = currentRes.ok ? await currentRes.json() : null;
    const requester = requesterRes.ok ? await requesterRes.json() : null;
    const alreadyAdmin = !!current?.administrador;
    if (!alreadyAdmin && !requester?.dono) return apiError("Sem permissão para definir administradores", 403);
  }

  const usuarioBody: any = {
    unidade: unidadeId,
    nome,
    email,
    telefone,
    administrador: !!isAdministrador,
    coletor: !!isColetor,
    embaixador: !!isEmbaixador,
  };
  if (prontuario !== undefined) usuarioBody.prontuario = prontuario;
  if (tipo !== undefined) usuarioBody.tipo = tipo;
  if (sexo !== undefined) usuarioBody.sexo = sexo;
  if (observacao !== undefined) usuarioBody.observacao = observacao;
  if (cpf !== undefined) usuarioBody.cpf = cpf?.replace(/\D/g, "") || "";
  if (nascimento) usuarioBody.nascimento = nascimento;
  if (senha) { usuarioBody.password = senha; usuarioBody.passwordConfirm = senha; }

  const res = await pbFetch(`/api/collections/usuario/records/${usuarioId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuarioBody),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any)?.message || "Erro ao atualizar usuário", data: (err as any)?.data }, { status: 400 });
  }
  const usuarioRecord = await res.json();
  const { password: _p, passwordConfirm: _pc, tokenKey: _tk, ...usuarioSafe } = usuarioRecord;

  return NextResponse.json({ ok: true, usuario: usuarioSafe });
});
