import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const unidadeId = new URL(request.url).searchParams.get("unidadeId");
  const filter = unidadeId ? encodeURIComponent(`unidade='${unidadeId}'`) : "";
  const url = filter
    ? `/api/collections/estoque/records?filter=${filter}&perPage=500`
    : `/api/collections/estoque/records?perPage=500`;
  const res = await pbFetch(url);
  if (!res.ok) return apiError("Falha ao buscar estoques");
  return NextResponse.json((await res.json()).items);
}
