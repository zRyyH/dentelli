import { NextResponse } from "next/server";
import { pbFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbFetch("/api/collections/indicacao/records?perPage=500&sort=-created");
  if (!res.ok) return apiError("Falha ao buscar indicações");
  return NextResponse.json((await res.json()).items);
}
