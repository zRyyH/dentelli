"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, ShoppingBag, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SimpleForm } from "@/components/simple-form";
import { useEmbaixadores, useProdutosAdmin, useSaldoEmbaixador } from "@/hooks/use-admin-data";
import { toast } from "sonner";

interface PedidoLine {
  _id: string;
  produtoId: string;
  produtoNome: string;
  pontosPorUnidade: number;
  quantidade: number;
}

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

export default function CadastrarPedidoPage() {
  const [embaixadorId, setEmbaixadorId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [lines, setLines] = useState<PedidoLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [novoProdutoId, setNovoProdutoId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState(1);

  const { data: embaixadores = [] } = useEmbaixadores();
  const { data: produtos = [] } = useProdutosAdmin();
  const { data: saldoData, isLoading: saldoLoading } = useSaldoEmbaixador(embaixadorId);

  const saldo = saldoData?.saldo ?? 0;
  const totalPontos = lines.reduce((sum, l) => sum + l.pontosPorUnidade * l.quantidade, 0);
  const saldoApos = saldo - totalPontos;
  const saldoInsuficiente = embaixadorId && totalPontos > saldo;

  const addLine = () => {
    if (!novoProdutoId) { toast.error("Selecione um produto"); return; }
    const produto = produtos.find((p) => p.id === novoProdutoId);
    if (!produto) return;
    const existing = lines.find((l) => l.produtoId === novoProdutoId);
    if (existing) {
      setLines((prev) => prev.map((l) => l.produtoId === novoProdutoId ? { ...l, quantidade: l.quantidade + novaQuantidade } : l));
    } else {
      setLines((prev) => [...prev, {
        _id: `${Date.now()}-${Math.random()}`,
        produtoId: produto.id, produtoNome: produto.nome,
        pontosPorUnidade: produto.pontos, quantidade: novaQuantidade,
      }]);
    }
    setNovoProdutoId(""); setNovaQuantidade(1);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l._id !== id));
  const updateQuantidade = (id: string, qty: number) => {
    if (qty < 1) { removeLine(id); return; }
    setLines((prev) => prev.map((l) => l._id === id ? { ...l, quantidade: qty } : l));
  };

  const handleSubmit = async () => {
    if (!embaixadorId) { toast.error("Selecione um embaixador"); return; }
    if (lines.length === 0) { toast.error("Adicione pelo menos um produto"); return; }
    if (saldoInsuficiente) { toast.error("Saldo insuficiente para este pedido"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embaixadorId, lines, totalPontos, observacao,
          saldo,
          embaixador: embaixadores.find((e) => e.id === embaixadorId) ?? { id: embaixadorId },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Falha ao criar pedido");
      }
      toast.success("Pedido cadastrado com sucesso!");
      setEmbaixadorId(""); setObservacao(""); setLines([]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SimpleForm title="CADASTRAR PEDIDO">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Embaixador</label>
          <Select value={embaixadorId} onValueChange={setEmbaixadorId} items={Object.fromEntries(embaixadores.map((e) => [e.id, e.nome]))}>
            <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione um embaixador" /></SelectTrigger>
            <SelectContent>{embaixadores.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {embaixadorId && (
          <div>
            <label className={lbl}>Saldo disponível</label>
            {saldoLoading ? (
              <div className="flex items-center gap-2 h-9"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/40">
                <Wallet className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-primary">{saldo.toLocaleString("pt-BR")} pts</span>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-border" />

      <div>
        <Label className={lbl}>Adicionar produto</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={novoProdutoId} onValueChange={setNovoProdutoId} items={Object.fromEntries(produtos.map((p) => [p.id, `${p.nome} — ${p.pontos.toLocaleString("pt-BR")} pts`]))}>
              <SelectTrigger className="bg-card text-card-foreground h-9"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                {produtos.map((p) => <SelectItem key={p.id} value={p.id} label={`${p.nome} — ${p.pontos.toLocaleString("pt-BR")} pts`}>{p.nome} — {p.pontos.toLocaleString("pt-BR")} pts</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Input type="number" min={1} value={novaQuantidade}
              onChange={(e) => setNovaQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
              className={`${inp} text-center`} placeholder="Qtd" />
          </div>
          <Button type="button" variant="outline"
            className="h-9 px-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={addLine}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {lines.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-card-foreground">
              Itens do pedido — {lines.length} {lines.length === 1 ? "produto" : "produtos"}
            </span>
          </div>
          {lines.map((line, idx) => (
            <div key={line._id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-card-foreground truncate">{line.produtoNome}</p>
                <p className="text-xs text-muted-foreground">{line.pontosPorUnidade.toLocaleString("pt-BR")} pts/un</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQuantidade(line._id, line.quantidade - 1)}
                  className="h-6 w-6 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted text-sm font-bold">−</button>
                <span className="min-w-[28px] text-center text-sm font-bold text-card-foreground">{line.quantidade}</span>
                <button onClick={() => updateQuantidade(line._id, line.quantidade + 1)}
                  className="h-6 w-6 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted text-sm font-bold">+</button>
              </div>
              <span className="text-sm font-bold text-primary min-w-[80px] text-right">
                {(line.pontosPorUnidade * line.quantidade).toLocaleString("pt-BR")} pts
              </span>
              <button onClick={() => removeLine(line._id)}
                className="shrink-0 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="px-4 py-3 bg-muted/30 flex items-center justify-between border-t border-border">
            <span className="text-sm font-semibold text-muted-foreground">Total do pedido</span>
            <span className="text-base font-bold text-primary">{totalPontos.toLocaleString("pt-BR")} pts</span>
          </div>
          {embaixadorId && !saldoLoading && (
            <div className="px-4 py-2.5 flex items-center justify-between border-t border-border bg-muted/10">
              <span className="text-xs font-medium text-muted-foreground">Saldo após resgate</span>
              <span className={`text-sm font-bold ${saldoInsuficiente ? "text-destructive" : "text-emerald-600"}`}>
                {saldoApos.toLocaleString("pt-BR")} pts
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className={lbl}>Observação (opcional)</label>
        <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} className={inp} placeholder="Observação sobre o pedido..." />
      </div>

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        <Button className="px-14 py-3 text-base font-bold tracking-wide" onClick={handleSubmit}
          disabled={submitting || !embaixadorId || lines.length === 0 || !!saldoInsuficiente}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> ENVIANDO...</> : "CADASTRAR PEDIDO"}
        </Button>
      </div>
    </SimpleForm>
  );
}
