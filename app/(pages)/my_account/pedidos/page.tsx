"use client";

import { useState } from "react";
import Link from "next/link";
import { useUnidade } from "@/hooks/use-unidade";
import { Search, Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AccountLayout } from "@/components/account-layout";
import { useProducts, getProductImageUrl } from "@/hooks/use-products";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLoader } from "@/components/page-loader";
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

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9.5 2 7 4 7 6.5c0 1.2.3 2.3.5 3.5C8 13 8 17 9.5 21c.4 1 1.5 1 2 0l.5-2 .5 2c.5 1 1.6 1 2 0C16 17 16 13 16.5 10c.2-1.2.5-2.3.5-3.5C17 4 14.5 2 12 2z" />
    </svg>
  );
}

const statusConfig: Record<string, { label: string; color: string; accent: string }> = {
  PENDENTE:  { label: "Aguardando",  color: "text-amber-500",   accent: "bg-amber-400" },
  CONCLUIDO: { label: "Concluído",   color: "text-emerald-500", accent: "bg-emerald-400" },
  CANCELADO: { label: "Cancelado",   color: "text-red-500",     accent: "bg-red-400" },
};

const STATUS_FILTERS = ["TODOS", "PENDENTE", "CONCLUIDO", "CANCELADO"] as const;
const FILTER_LABELS: Record<string, string> = {
  TODOS: "Todos", PENDENTE: "Aguardando", CONCLUIDO: "Concluído", CANCELADO: "Cancelado",
};

function PedidoCard({ pedido, products, onCancel, cancelling }: {
  pedido: Pedido;
  products: any[];
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = pedido.itemDetails.reduce((s, i) => s + i.pontos * i.quantidade, 0);
  const canCancel = pedido.status === "PENDENTE";
  const cfg = statusConfig[pedido.status] || { label: pedido.status, color: "text-muted-foreground", accent: "bg-muted-foreground" };
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
      <div className="flex">
        {/* Faixa lateral colorida */}
        <div className={`w-1 shrink-0 ${cfg.accent}`} />

        <div className="flex-1 min-w-0">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Thumbnails */}
              <div className="flex gap-1 shrink-0">
                {pedido.itemDetails.slice(0, 3).map((item) => {
                  const product = products.find((p) => p.id === item.produto);
                  const imageUrl = product ? getProductImageUrl(product) : "";
                  return (
                    <div key={item.id} className="relative">
                      <div className="h-8 w-8 rounded-xl border border-border/50 bg-muted overflow-hidden">
                        {imageUrl
                          ? <img src={imageUrl} alt={product?.nome} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center">
                              <ToothIcon className="h-4 w-4 text-muted-foreground/25" />
                            </div>}
                      </div>
                      {item.quantidade > 1 && (
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                          {item.quantidade}
                        </span>
                      )}
                    </div>
                  );
                })}
                {pedido.itemDetails.length > 3 && (
                  <div className="h-8 w-8 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
                    +{pedido.itemDetails.length - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.accent}`} />
                  <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-muted-foreground/30 text-[10px]">·</span>
                  <span className="text-[11px] text-muted-foreground/50 truncate">{formatDate(pedido.created)}</span>
                </div>
              </div>

              {/* Pontos + chevron */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-base font-bold tabular-nums text-foreground">{total.toLocaleString("pt-BR")}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-0.5">pts</span>
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Expansão */}
          {expanded && (
            <div className="border-t border-border/40 bg-muted/10 px-5 py-4 space-y-3">
              {pedido.itemDetails.map((item) => {
                const product = products.find((p) => p.id === item.produto);
                const imageUrl = product ? getProductImageUrl(product) : "";
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl border border-border/50 bg-muted overflow-hidden shrink-0">
                      {imageUrl
                        ? <img src={imageUrl} alt={product?.nome} className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center">
                            <ToothIcon className="h-4 w-4 text-muted-foreground/25" />
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{product?.nome || "Produto"}</p>
                      <p className="text-[11px] text-muted-foreground/60">{item.quantidade}× · {item.pontos.toLocaleString("pt-BR")} pts/un</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      {(item.pontos * item.quantidade).toLocaleString("pt-BR")}
                      <span className="text-[10px] font-normal text-muted-foreground ml-0.5">pts</span>
                    </p>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="font-mono text-[10px] text-muted-foreground/40">
                  #{pedido.id.slice(0, 12).toUpperCase()}
                </span>
                {canCancel && (
                  <button
                    onClick={() => onCancel(pedido.id)}
                    disabled={cancelling}
                    className="text-[11px] font-medium text-muted-foreground/60 hover:text-red-500 transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    {cancelling && <Loader2 className="h-3 w-3 animate-spin" />}
                    {cancelling ? "Cancelando..." : "Cancelar pedido"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { selectedId: unidadeId, selectedNome, unidades } = useUnidade();

  const { data: pedidos = [], isLoading: pedidosLoading } = useQuery<Pedido[]>({
    queryKey: ["pedidos", unidadeId],
    queryFn: () => {
      const url = unidadeId ? `/api/pedidos?unidadeId=${unidadeId}` : "/api/pedidos";
      return fetch(url).then((r) => r.ok ? r.json() : []);
    },
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
      queryClient.invalidateQueries({ queryKey: ["pedidos", unidadeId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar pedido");
    } finally {
      setCancellingId(null);
    }
  };

  const isLoading = pedidosLoading || productsLoading;

  const filtered = pedidos.filter((p) => {
    const matchSearch = !search || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "TODOS" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = pedidos.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AccountLayout>
      <div className="pb-20">
        {unidades.length > 1 && selectedNome && (
          <div className="flex items-center gap-1.5 mb-5 text-xs text-muted-foreground/60">
            <MapPin className="h-3 w-3" />
            <span>{selectedNome}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-border/60 bg-muted/20 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            const cfg = statusConfig[s];
            const count = s === "TODOS" ? pedidos.length : (counts[s] || 0);
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cfg && (
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.accent} ${active ? "opacity-100" : "opacity-40"}`} />
                )}
                {FILTER_LABELS[s]}
                {count > 0 && (
                  <span className={`tabular-nums ${active ? "opacity-60" : "opacity-40"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ToothIcon className="h-12 w-12 text-muted-foreground/15 mb-5" />
            <p className="text-sm font-medium text-foreground mb-1">Nenhum resgate encontrado</p>
            <p className="text-xs text-muted-foreground/60 mb-6">
              {search || statusFilter !== "TODOS" ? "Tente outros filtros" : "Seus resgates aparecerão aqui"}
            </p>
            {!search && statusFilter === "TODOS" && (
              <Link href="/rewards" className={buttonVariants({ variant: "outline", size: "sm" }) + " rounded-full text-xs"}>
                Ver recompensas
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                products={products}
                onCancel={handleCancel}
                cancelling={cancellingId === pedido.id}
              />
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
