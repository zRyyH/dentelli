import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError } from "@/lib/pb-server";

export async function GET(_request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const userId = getUserIdFromToken(token);
  if (!userId) return apiError("Token inválido", 401);

  const filter = encodeURIComponent(`usuario='${userId}'`);
  const res = await pbFetch(`/api/collections/saldo/records?filter=${filter}&perPage=1`);
  if (!res.ok) return apiError("Falha ao buscar saldo");

  const item = (await res.json()).items?.[0] || { saldo: 0, pendente: 0, credito: 0, debito: 0 };
  return NextResponse.json(item);
}
