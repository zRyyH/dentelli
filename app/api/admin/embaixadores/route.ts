import { NextRequest, NextResponse } from "next/server";
import { pbFetch, getPbToken, getUserIdFromToken, apiError, getAdminProfile } from "@/lib/pb-server";

export async function GET(request: NextRequest) {
  const token = await getPbToken();
  if (!token) return apiError("Não autenticado", 401);
  const adminId = getUserIdFromToken(token);
  if (!adminId) return apiError("Token inválido", 401);

  const requestedUnidadeId = new URL(request.url).searchParams.get("unidadeId");
  const { unidades: adminUnidades, isDono } = await getAdminProfile(adminId);

  // Se solicitou unidade específica, verifica que pertence ao admin (donos passam sempre)
  if (requestedUnidadeId) {
    if (!isDono && !adminUnidades.includes(requestedUnidadeId)) {
      return apiError("Sem permissão para esta unidade", 403);
    }
    const filter = encodeURIComponent(`embaixador=true && unidade~'${requestedUnidadeId}'`);
    const res = await pbFetch(`/api/collections/usuario/records?filter=${filter}&perPage=500`);
    if (!res.ok) return apiError("Falha ao buscar embaixadores");
    return NextResponse.json((await res.json()).items);
  }

  // Dono ou admin sem unidades restritas: retorna todos
  if (isDono || adminUnidades.length === 0) {
    const res = await pbFetch(`/api/collections/usuario/records?filter=${encodeURIComponent("embaixador=true")}&perPage=500`);
    if (!res.ok) return apiError("Falha ao buscar embaixadores");
    return NextResponse.json((await res.json()).items);
  }

  // Admin comum: filtra pelas suas unidades
  const unidadeFilter = adminUnidades.map((id: string) => `unidade~'${id}'`).join(" || ");
  const filter = encodeURIComponent(`embaixador=true && (${unidadeFilter})`);
  const res = await pbFetch(`/api/collections/usuario/records?filter=${filter}&perPage=500`);
  if (!res.ok) return apiError("Falha ao buscar embaixadores");
  return NextResponse.json((await res.json()).items);
}
