import { NextRequest, NextResponse } from "next/server";
import { pbFetch, pbAdminFetch, getPbToken, getUserIdFromToken, apiError, getAdminProfile } from "@/lib/pb-server";
import { withWebhook } from "@/lib/with-webhook";

/** Retorna true se os dois arrays têm pelo menos um elemento em comum. */
function intersects(a: string[], b: string[]): boolean {
  return a.some((id) => b.includes(id));
}

async function getTargetUnidades(usuarioId: string): Promise<string[]> {
  const res = await pbFetch(`/api/collections/usuario/records/${usuarioId}?fields=unidade`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.unidade) ? data.unidade : data.unidade ? [data.unidade] : [];
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const requesterId = getUserIdFromToken(token);
  if (!requesterId) return apiError("Token inválido", 401);

  const { id: usuarioId } = await params;

  const [{ unidades: adminUnidades, isDono }, targetUnidades] = await Promise.all([
    getAdminProfile(requesterId),
    getTargetUnidades(usuarioId),
  ]);

  if (!isDono && !intersects(adminUnidades, targetUnidades)) {
    return apiError("Sem permissão para acessar este usuário", 403);
  }

  const res = await pbFetch(`/api/collections/usuario/records/${usuarioId}`);
  if (!res.ok) return apiError("Usuário não encontrado", 404);
  return NextResponse.json(await res.json());
}

export const PATCH = withWebhook(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const requesterId = getUserIdFromToken(token);
  if (!requesterId) return apiError("Token inválido", 401);

  const { id: usuarioId } = await params;
  const body = await request.json();
  const {
    unidadeIds, nome, prontuario, tipo, sexo,
    telefone, nascimento, cpf, observacao, email, senha,
    isAdministrador, isColetor, isEmbaixador,
  } = body;

  // Busca perfil do admin e unidades do usuário alvo em paralelo
  const [{ unidades: adminUnidades, isDono: adminIsDono }, targetUnidades] = await Promise.all([
    getAdminProfile(requesterId),
    getTargetUnidades(usuarioId),
  ]);

  if (!adminIsDono) {
    // Admin comum só edita usuários que compartilham pelo menos uma unidade
    if (!intersects(adminUnidades, targetUnidades)) {
      return apiError("Sem permissão para editar este usuário", 403);
    }
    // Novas unidades (se alteradas) devem pertencer ao admin
    if (Array.isArray(unidadeIds) && unidadeIds.length) {
      const invalid = unidadeIds.filter((id: string) => !adminUnidades.includes(id));
      if (invalid.length) return apiError("Sem permissão para uma ou mais unidades selecionadas", 403);
    }
  }

  // Apenas donos podem ativar administrador=true em quem ainda não tem
  if (isAdministrador && !adminIsDono) {
    const currentRes = await pbAdminFetch(`/api/collections/usuario/records/${usuarioId}?fields=administrador`);
    const current = currentRes.ok ? await currentRes.json() : null;
    if (!current?.administrador) return apiError("Sem permissão para definir administradores", 403);
  }

  const usuarioBody: any = {
    nome, email, telefone,
    administrador: !!isAdministrador,
    coletor: !!isColetor,
    embaixador: !!isEmbaixador,
  };
  if (Array.isArray(unidadeIds) && unidadeIds.length) usuarioBody.unidade = unidadeIds;
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
