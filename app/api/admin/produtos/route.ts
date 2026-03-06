import { NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbFetch("/api/collections/produto/records?perPage=200&sort=nome");
  if (!res.ok) return apiError("Falha ao buscar produtos");
  return NextResponse.json((await res.json()).items);
}
