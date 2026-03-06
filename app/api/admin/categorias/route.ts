import { NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbFetch("/api/collections/categoria/records?perPage=50");
  if (!res.ok) return apiError("Falha ao buscar categorias");
  return NextResponse.json((await res.json()).items);
}
