import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const unidadeId = request.nextUrl.searchParams.get("unidadeId");
  const unidadeFilter = unidadeId ? ` && unidade='${unidadeId}'` : "";
  const filter = encodeURIComponent(`usuario='${userId}'${unidadeFilter}`);

  const res = await pbFetch(`/api/collections/historico/records?filter=${filter}&perPage=200&sort=-created`);
  if (!res.ok) return apiError("Falha ao buscar histórico");

  return NextResponse.json((await res.json()).items ?? []);
}
