import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const usuarioId = url.searchParams.get("usuarioId");
  const unidadeId = url.searchParams.get("unidadeId");
  if (!usuarioId) return apiError("usuarioId obrigatório", 400);

  const filter = encodeURIComponent(
    unidadeId ? `usuario='${usuarioId}' && unidade='${unidadeId}'` : `usuario='${usuarioId}'`
  );
  const res = await pbFetch(`/api/collections/saldo/records?filter=${filter}&perPage=1`);
  if (!res.ok) return apiError("Falha ao buscar saldo");

  const item = (await res.json()).items?.[0] || { saldo: 0, pendente: 0, credito: 0, debito: 0 };
  return NextResponse.json(item);
}
