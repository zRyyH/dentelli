"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountLayout } from "@/components/account-layout";
import { useProducts, getProductImageUrl } from "@/hooks/use-products";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PedidoItem {
  id: string;
  produto: string;
  quantidade: number;
  pontos: number;
}

interface Pedido {
  id: string;
  pontos: number;
  status: string;
  created: string;
  item: string[];
  itemDetails: PedidoItem[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "text-amber-600 bg-amber-50" },
  APROVADO: { label: "Aprovado", className: "text-emerald-600 bg-emerald-50" },
  PROCESSADO: { label: "Processado", className: "text-emerald-600 bg-emerald-50" },
  CANCELADO: { label: "Cancelado", className: "text-red-500 bg-red-50" },
};

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: products = [] } = useProducts();

  const { data: pedidos = [] } = useQuery<Pedido[]>({
    queryKey: ["pedidos"],
    queryFn: () => fetch("/api/pedidos").then((r) => r.ok ? r.json() : []),
  });

  const handleCancel = async (pedidoId: string) => {
    setCancellingId(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Erro ao cancelar");
      }
      toast.success("Pedido cancelado.");
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar pedido");
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const filtered = pedidos.filter((p) => !search || p.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <AccountLayout>
      <div className="mb-8">
        <Input
          placeholder="Buscar por ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-sm bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="h-8 w-8 mb-4 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground mb-5">Nenhum pedido encontrado</p>
          <Link href="/rewards" className={buttonVariants({ variant: "outline", size: "sm" }) + " rounded-full text-xs"}>Ver recompensas</Link>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {filtered.map((pedido) => {
            const cfg = statusConfig[pedido.status] || { label: pedido.status, className: "text-muted-foreground bg-muted" };
            const total = pedido.itemDetails.reduce((s, i) => s + i.pontos * i.quantidade, 0);
            return (
              <div key={pedido.id} className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">#{pedido.id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground/60">{formatDate(pedido.created)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                    {pedido.status === "PENDENTE" && (
                      <button className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors disabled:opacity-40"
                        disabled={cancellingId === pedido.id} onClick={() => handleCancel(pedido.id)}>
                        {cancellingId === pedido.id ? "…" : "Cancelar"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {pedido.itemDetails.map((item) => {
                    const product = products.find((p) => p.id === item.produto);
                    const imageUrl = product ? getProductImageUrl(product) : "";
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-muted overflow-hidden shrink-0">
                          {imageUrl ? <img src={imageUrl} alt={product?.nome} className="h-full w-full object-cover" /> : null}
                        </div>
                        <span className="flex-1 text-sm truncate">{product?.nome || "Produto"}</span>
                        <span className="text-xs text-muted-foreground">×{item.quantidade}</span>
                        <span className="text-xs font-medium tabular-nums">{(item.pontos * item.quantidade).toLocaleString("pt-BR")} pts</span>
                      </div>
                    );
                  })}
                </div>
                {pedido.itemDetails.length > 0 && (
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      Total: <span className="font-medium text-foreground">{total.toLocaleString("pt-BR")} pts</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
