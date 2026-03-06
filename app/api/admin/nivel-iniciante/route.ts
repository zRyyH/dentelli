import { NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const filter = encodeURIComponent("(nome='Iniciante')");
  const res = await pbFetch(`/api/collections/nivel/records?filter=${filter}&perPage=1`);
  if (!res.ok) return apiError("Falha ao buscar nível iniciante");
  const item = (await res.json()).items?.[0] || null;
  return NextResponse.json(item);
}
