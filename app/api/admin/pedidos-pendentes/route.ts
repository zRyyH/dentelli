import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const embaixadorId = new URL(request.url).searchParams.get("embaixadorId");
  if (!embaixadorId) return apiError("embaixadorId obrigatório", 400);

  const filter = encodeURIComponent(`status='PENDENTE' && usuario='${embaixadorId}'`);
  const res = await pbFetch(`/api/collections/pedido/records?filter=${filter}&perPage=500`);
  if (!res.ok) return apiError("Falha ao buscar pedidos pendentes");

  return NextResponse.json((await res.json()).items);
}
