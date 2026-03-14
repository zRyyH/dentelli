"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, Loader2, Plus, Minus, X,
  AlertTriangle, Wallet, ArrowLeft, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import { FloatingButtons } from "@/components/floating-buttons";
import { PageTransition } from "@/components/page-transition";
import { useCart } from "@/hooks/use-cart";
import { useProducts, getProductImageUrl } from "@/hooks/use-products";
import { useUnidade } from "@/hooks/use-unidade";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface EstoqueItem {
  id: string;
  produto_id: string;
  quantidade: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPontos, isLoading, pedido, updateItemQuantity, removeFromCart } = useCart();
  const { data: products = [] } = useProducts();
  const { selectedId: unidadeId } = useUnidade();
  const [submitting, setSubmitting] = useState(false);

  const { data: estoqueItems = [], isLoading: estoqueLoading } = useQuery<EstoqueItem[]>({
    queryKey: ["estoque-checkout", unidadeId],
    queryFn: () => {
      const url = unidadeId ? `/api/admin/estoques?unidadeId=${unidadeId}` : "/api/admin/estoques";
      return fetch(url).then((r) => r.ok ? r.json() : []);
    },
  });

  const { data: saldoData, isLoading: saldoLoading } = useQuery<{ saldo: number }>({
    queryKey: ["saldo-checkout", unidadeId],
    queryFn: () => {
      const url = unidadeId ? `/api/saldo?unidadeId=${unidadeId}` : "/api/saldo";
      return fetch(url).then((r) => r.ok ? r.json() : { saldo: 0 });
    },
  });

  const pageLoading = isLoading || estoqueLoading || saldoLoading;
  const saldo = saldoData?.saldo ?? 0;
  const saldoApos = saldo - totalPontos;
  const insufficientBalance = totalPontos > saldo;

  const getStock = (produtoId: string) => estoqueItems.find((e) => e.produto_id === produtoId)?.quantidade ?? 0;
  const hasStockIssues = items.some((item) => getStock(item.produto) < item.quantidade);
  const canCheckout = !hasStockIssues && !insufficientBalance && !!pedido && items.length > 0;

  const handleSolicitarResgate = async () => {
    if (!pedido) return;
    if (hasStockIssues) { toast.error("Alguns itens não possuem estoque suficiente."); return; }
    if (insufficientBalance) { toast.error("Saldo insuficiente para este resgate."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedido.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Erro ao solicitar resgate");
      }
      toast.success("Resgate solicitado com sucesso!");
      router.push("/my_account/pedidos");
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar resgate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <PageTransition>
      {/* Header */}
      <div className="relative overflow-hidden bg-primary">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-2xl mx-auto px-4 py-7 flex items-center gap-4">
          <button onClick={() => router.back()}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">Carrinho</h1>
            {!isLoading && items.length > 0 && (
              <p className="text-white/70 text-xs mt-0.5">{items.length} {items.length === 1 ? "item" : "itens"}</p>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4 flex-1">
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <ShoppingBag className="h-9 w-9 opacity-40" />
            </div>
            <p className="text-base font-semibold text-foreground">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Adicione produtos para continuar</p>
            <Button asChild variant="outline" className="rounded-full px-7">
              <Link href="/rewards">Ver Recompensas</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Balance */}
            <div className="rounded-2xl p-4 flex items-center gap-4 bg-card border border-border">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seu Saldo</p>
                <p className="text-2xl font-bold text-primary">
                  {saldo.toLocaleString("pt-BR")} <span className="text-base font-semibold text-muted-foreground">pts</span>
                </p>
              </div>
              {totalPontos > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">Este pedido</p>
                  <p className={`text-sm font-bold ${insufficientBalance ? "text-destructive" : ""}`}>
                    {totalPontos.toLocaleString("pt-BR")} pts
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border">
              <div className="px-5 py-3.5 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens do pedido</p>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const prod = products.find((p) => p.id === item.produto);
                  const img = prod ? getProductImageUrl(prod) : "";
                  const stock = getStock(item.produto);
                  const stockIssue = stock < item.quantidade;
                  return (
                    <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${stockIssue ? "bg-destructive/[0.04]" : ""}`}>
                      <div className="h-[72px] w-[72px] rounded-xl overflow-hidden shrink-0 bg-muted">
                        {img
                          ? <img src={img} alt={prod?.nome} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center text-2xl">🎁</div>}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-semibold leading-tight truncate pr-2">{prod?.nome || "Produto"}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateItemQuantity.mutate({ itemId: item.id, newQuantity: item.quantidade - 1 })}
                            className="h-7 w-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-bold min-w-[24px] text-center">{item.quantidade}</span>
                          <button onClick={() => updateItemQuantity.mutate({ itemId: item.id, newQuantity: item.quantidade + 1 })}
                            className="h-7 w-7 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted">
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="text-xs text-muted-foreground ml-1">× {item.pontos.toLocaleString("pt-BR")} pts</span>
                        </div>
                        {stockIssue && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-destructive">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            Estoque: {stock} un. disponível
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-2">
                        <p className="text-base font-bold text-primary">
                          {(item.pontos * item.quantidade).toLocaleString("pt-BR")}
                          <span className="text-xs font-semibold text-muted-foreground ml-1">pts</span>
                        </p>
                        <button onClick={() => removeFromCart.mutate(item.id)}
                          className="flex items-center justify-center h-7 w-7 rounded-full ml-auto hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border">
              <div className="px-5 py-3.5 border-b border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total do pedido</span>
                  <span className="text-sm font-bold">{totalPontos.toLocaleString("pt-BR")} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" /> Saldo após resgate
                  </span>
                  <span className={`text-sm font-bold ${insufficientBalance ? "text-destructive" : "text-emerald-600"}`}>
                    {saldoApos.toLocaleString("pt-BR")} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {(hasStockIssues || insufficientBalance) && (
              <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3 bg-destructive/[0.07] border border-destructive/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                <div className="space-y-1">
                  {hasStockIssues && <p className="text-sm text-destructive font-medium">Alguns itens não possuem estoque suficiente.</p>}
                  {insufficientBalance && (
                    <p className="text-sm text-destructive font-medium">
                      Saldo insuficiente — você precisa de mais {(totalPontos - saldo).toLocaleString("pt-BR")} pts.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pb-2">
              <Button onClick={handleSolicitarResgate} disabled={!canCheckout || submitting}
                className="w-full py-4 text-sm font-bold tracking-widest rounded-2xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {canCheckout
                  ? `SOLICITAR RESGATE — ${totalPontos.toLocaleString("pt-BR")} PTS`
                  : "SOLICITAR RESGATE"}
              </Button>
            </div>
          </>
        )}
      </main>

      </PageTransition>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
