import { NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

export async function GET() {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  // Busca o registro atualizado do usuário para pegar as unidades
  const userRes = await pbFetch(`/api/collections/usuario/records/${userId}`);
  if (!userRes.ok) return apiError("Falha ao buscar usuário");
  const user = await userRes.json();

  const ids: string[] = Array.isArray(user.unidade) ? user.unidade : [];
  if (!ids.length) return NextResponse.json([]);

  // Busca as unidades pelo nome
  const filter = ids.map((id) => `id='${id}'`).join("||");
  const unidadesRes = await pbFetch(`/api/collections/unidade/records?filter=(${filter})&perPage=100`);
  if (!unidadesRes.ok) return NextResponse.json([]);

  const unidades = (await unidadesRes.json()).items as { id: string; nome: string }[];
  // Mantém a ordem original dos IDs do usuário
  const sorted = ids.map((id) => unidades.find((u) => u.id === id)).filter(Boolean);
  return NextResponse.json(sorted);
}
