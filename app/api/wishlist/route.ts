import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

export async function GET(_request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const filter = encodeURIComponent(`usuario='${userId}'`);
  const res = await pbFetch(`/api/collections/desejo/records?filter=${filter}&perPage=200`);
  if (!res.ok) return apiError("Falha ao buscar lista de desejos");

  return NextResponse.json((await res.json()).items);
}
