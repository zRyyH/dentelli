import { NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbFetch("/api/collections/missao/records?perPage=100");
  if (!res.ok) return apiError("Falha ao buscar missões");
  return NextResponse.json((await res.json()).items);
}
