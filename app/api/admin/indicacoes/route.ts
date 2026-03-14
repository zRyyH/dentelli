import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, apiError } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);

  const embaixadorId = new URL(request.url).searchParams.get("embaixadorId");

  const filter = embaixadorId
    ? encodeURIComponent(`usuario_embaixador='${embaixadorId}'`)
    : "";
  const url = filter
    ? `/api/collections/indicacao/records?filter=${filter}&perPage=500&sort=-created`
    : `/api/collections/indicacao/records?perPage=500&sort=-created`;

  const res = await pbFetch(url);
  if (!res.ok) return apiError("Falha ao buscar indicações");
  return NextResponse.json((await res.json()).items);
}
