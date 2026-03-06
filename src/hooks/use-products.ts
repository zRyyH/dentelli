import { useQuery } from "@tanstack/react-query";
import { PB_BASE_URL } from "@/lib/pb";
import type { Product } from "@/lib/types";

export function getProductImageUrl(product: Product): string {
  const foto = Array.isArray(product.foto) ? product.foto[0] : product.foto;
  if (!foto) return "";
  return `${PB_BASE_URL}/api/files/${product.collectionId}/${product.id}/${foto}`;
}

export function getProductImages(product: Product): string[] {
  const fotos = Array.isArray(product.foto) ? product.foto : [product.foto];
  return fotos.filter(Boolean).map(
    (f) => `${PB_BASE_URL}/api/files/${product.collectionId}/${product.id}/${f}`
  );
}

async function fetchProducts(all = false): Promise<Product[]> {
  const res = await fetch(`/api/products${all ? "?all=true" : ""}`);
  if (!res.ok) throw new Error("Falha ao buscar produtos");
  return res.json();
}

async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error("Produto não encontrado");
  return res.json();
}

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: () => fetchProducts(false) });

export const useAllProducts = () =>
  useQuery({ queryKey: ["products-all"], queryFn: () => fetchProducts(true) });

export const useProduct = (id?: string) =>
  useQuery({ queryKey: ["product", id], queryFn: () => fetchProduct(id!), enabled: !!id });
