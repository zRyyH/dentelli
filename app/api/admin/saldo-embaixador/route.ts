import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const usuarioId = new URL(request.url).searchParams.get("usuarioId");
  if (!usuarioId) return apiError("usuarioId obrigatório", 400);

  const filter = encodeURIComponent(`usuario='${usuarioId}'`);
  const res = await pbFetch(`/api/collections/saldo/records?filter=${filter}&perPage=1`);
  if (!res.ok) return apiError("Falha ao buscar saldo");

  const item = (await res.json()).items?.[0] || { saldo: 0, pendente: 0, credito: 0, debito: 0 };
  return NextResponse.json(item);
}
