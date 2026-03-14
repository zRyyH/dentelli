import { NextResponse } from "next/server";
import { pbAdminFetch, apiError } from "@/lib/pb-server";

export async function GET() {
  const res = await pbAdminFetch("/api/collections/usuario");
  if (!res.ok) return apiError("Falha ao buscar schema");
  const schema = await res.json();

  const fields: any[] = schema.fields ?? schema.schema ?? [];
  const field = fields.find((f: any) => f.name === "sexo");
  const values: string[] = field?.options?.values ?? field?.values ?? [];

  return NextResponse.json(values);
}
