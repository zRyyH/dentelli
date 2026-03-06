import { NextRequest, NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const unidadeId = new URL(request.url).searchParams.get("unidadeId");
  const filter = unidadeId
    ? `(embaixador=true && unidade='${unidadeId}')`
    : "(embaixador=true)";
  const res = await pbFetch(
    `/api/collections/usuario/records?filter=${encodeURIComponent(filter)}&perPage=100`
  );
  if (!res.ok) return apiError("Falha ao buscar embaixadores");
  return NextResponse.json((await res.json()).items);
}
