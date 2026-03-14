"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2, ShoppingBag, Wallet, PackageX, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchSelect } from "@/components/search-select";
import { SimpleForm } from "@/components/simple-form";
import { useEmbaixadores, useEstoques, useProdutosAdmin, useSaldoEmbaixador } from "@/hooks/use-admin-data";
import { useUnidade } from "@/hooks/use-unidade";
import { toast } from "sonner";

interface PedidoLine {
  _id: string;
  produtoId: string;
  produtoNome: string;
  pontosPorUnidade: number;
  quantidade: number;
  estoqueMax: number;
}

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

export default function CadastrarPedidoPage() {
  const [unidadeId, setUnidadeId] = useState("");
  const [embaixadorId, setEmbaixadorId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [lines, setLines] = useState<PedidoLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [novoProdutoId, setNovoProdutoId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState(1);

  const { unidades } = useUnidade();
  const { data: embaixadores = [], isLoading: loadingEmb } = useEmbaixadores(unidadeId || undefined);
  const { data: estoques = [], isLoading: loadingEstoque } = useEstoques(unidadeId);
  const { data: produtos = [] } = useProdutosAdmin();
  const { data: saldoData, isLoading: saldoLoading } = useSaldoEmbaixador(embaixadorId, unidadeId || undefined);

  // Produtos disponíveis: estoque > 0, cruzado com pontos do produto
  const produtosDisponiveis = useMemo(() => {
    return estoques
      .filter((e) => e.quantidade > 0)
      .map((e) => {
        const prod = produtos.find((p) => p.id === e.produto_id);
        const noCarrinho = lines.find((l) => l.produtoId === e.produto_id)?.quantidade ?? 0;
        return {
          ...e,
          pontos: prod?.pontos ?? 0,
          disponivel: e.quantidade - noCarrinho,
        };
      })
      .filter((e) => e.disponivel > 0);
  }, [estoques, produtos, lines]);

  const saldo = saldoData?.saldo ?? 0;
  const totalPontos = lines.reduce((sum, l) => sum + l.pontosPorUnidade * l.quantidade, 0);
  const saldoApos = saldo - totalPontos;
  const saldoInsuficiente = !!embaixadorId && !saldoLoading && totalPontos > saldo;
  const linhasComProblema = lines.filter((l) => l.quantidade > l.estoqueMax);

  const handleUnidadeChange = (id: string) => {
    setUnidadeId(id);
    setEmbaixadorId("");
    setLines([]);
    setNovoProdutoId("");
    setNovaQuantidade(1);
  };

  const estoqueDoNovoProduto = produtosDisponiveis.find((e) => e.produto_id === novoProdutoId);

  const addLine = () => {
    if (!novoProdutoId) { toast.error("Selecione um produto"); return; }
    const estoque = estoques.find((e) => e.produto_id === novoProdutoId);
    const prod = produtos.find((p) => p.id === novoProdutoId);
    if (!estoque) { toast.error("Produto sem estoque"); return; }

    const existing = lines.find((l) => l.produtoId === novoProdutoId);
    const jaNoCarrinho = existing?.quantidade ?? 0;
    const disponivel = estoque.quantidade - jaNoCarrinho;
    if (disponivel <= 0) { toast.error(`Estoque esgotado para ${estoque.produto_nome}`); return; }

    const qtdFinal = Math.min(novaQuantidade, disponivel);
    if (qtdFinal < novaQuantidade) toast.warning(`Quantidade ajustada para ${qtdFinal} (limite do estoque)`);

    if (existing) {
      setLines((prev) => prev.map((l) => l.produtoId === novoProdutoId
        ? { ...l, quantidade: l.quantidade + qtdFinal }
        : l));
    } else {
      setLines((prev) => [...prev, {
        _id: `${Date.now()}-${Math.random()}`,
        produtoId: estoque.produto_id,
        produtoNome: estoque.produto_nome,
        pontosPorUnidade: prod?.pontos ?? 0,
        quantidade: qtdFinal,
        estoqueMax: estoque.quantidade,
      }]);
    }
    setNovoProdutoId(""); setNovaQuantidade(1);
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l._id !== id));

  const updateQuantidade = (line: PedidoLine, qty: number) => {
    if (qty < 1) { removeLine(line._id); return; }
    if (qty > line.estoqueMax) { toast.error(`Máximo disponível: ${line.estoqueMax}`); return; }
    setLines((prev) => prev.map((l) => l._id === line._id ? { ...l, quantidade: qty } : l));
  };

  const handleSubmit = async () => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return; }
    if (!embaixadorId) { toast.error("Selecione um embaixador"); return; }
    if (lines.length === 0) { toast.error("Adicione pelo menos um produto"); return; }
    if (saldoInsuficiente) { toast.error("Saldo insuficiente para este pedido"); return; }
    if (linhasComProblema.length > 0) { toast.error("Quantidade de algum produto excede o estoque"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embaixadorId, unidadeId, observacao,
          lines: lines.map((l) => ({ produtoId: l.produtoId, quantidade: l.quantidade })),
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

  const podeSubmeter = !submitting && !!unidadeId && !!embaixadorId && lines.length > 0 && !saldoInsuficiente && linhasComProblema.length === 0;

  return (
    <SimpleForm title="CADASTRAR PEDIDO">

      {/* ── Unidade + Embaixador ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Unidade</label>
          <SearchSelect
            value={unidadeId}
            onChange={handleUnidadeChange}
            options={unidades.map((u) => ({ id: u.id, label: u.nome }))}
            placeholder="Selecione uma unidade"
            loading={unidades.length === 0}
          />
        </div>
        <div>
          <label className={lbl}>Embaixador</label>
          <SearchSelect
            value={embaixadorId}
            onChange={setEmbaixadorId}
            options={embaixadores.map((e) => ({
              id: e.id, label: e.nome,
              searchText: [(e as any).cpf, (e as any).telefone].filter(Boolean).join(" "),
            }))}
            placeholder={!unidadeId ? "Selecione a unidade primeiro" : "Selecione um embaixador"}
            disabled={!unidadeId}
            loading={!!unidadeId && loadingEmb}
          />
        </div>
      </div>

      {/* ── Saldo do embaixador ── */}
      {embaixadorId && (
        <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">Saldo disponível</span>
          </div>
          {saldoLoading
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : <span className="text-2xl font-bold text-primary tabular-nums">{saldo.toLocaleString("pt-BR")} <span className="text-sm font-medium">pts</span></span>}
        </div>
      )}

      <hr className="border-border" />

      {/* ── Adicionar produto ── */}
      <div>
        <label className={lbl}>Adicionar produto</label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <SearchSelect
              value={novoProdutoId}
              onChange={setNovoProdutoId}
              options={produtosDisponiveis.map((e) => ({
                id: e.produto_id,
                label: e.produto_nome,
                suffix: `${e.disponivel} un · ${e.pontos.toLocaleString("pt-BR")} pts`,
              }))}
              placeholder={!unidadeId ? "Selecione a unidade primeiro" : loadingEstoque ? "Carregando estoque..." : "Buscar produto..."}
              disabled={!unidadeId}
              loading={!!unidadeId && loadingEstoque}
            />
          </div>
          <div className="w-24">
            <Input
              type="number" min={1}
              max={estoqueDoNovoProduto?.disponivel ?? undefined}
              value={novaQuantidade}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                const max = estoqueDoNovoProduto?.disponivel;
                setNovaQuantidade(max ? Math.min(val, max) : val);
              }}
              className="bg-card text-card-foreground h-9 text-center"
            />
          </div>
          <Button type="button" variant="outline"
            className="h-9 px-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground shrink-0"
            onClick={addLine} disabled={!unidadeId || !novoProdutoId}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {/* Info do produto selecionado */}
        {estoqueDoNovoProduto && (
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Disponível: <span className="font-semibold text-foreground">{estoqueDoNovoProduto.disponivel} un</span></span>
            <span>Valor: <span className="font-semibold text-primary">{estoqueDoNovoProduto.pontos.toLocaleString("pt-BR")} pts/un</span></span>
            <span>Subtotal: <span className="font-semibold text-foreground">{(estoqueDoNovoProduto.pontos * novaQuantidade).toLocaleString("pt-BR")} pts</span></span>
          </div>
        )}
      </div>

      {/* Estoque vazio */}
      {unidadeId && !loadingEstoque && produtosDisponiveis.length === 0 && lines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center rounded-xl border border-dashed border-border">
          <PackageX className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum produto com estoque disponível nesta unidade.</p>
        </div>
      )}

      {/* ── Carrinho ── */}
      {lines.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-4 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-card-foreground">
                {lines.length} {lines.length === 1 ? "produto" : "produtos"} no pedido
              </span>
            </div>
            {linhasComProblema.length > 0 && (
              <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Estoque insuficiente
              </div>
            )}
          </div>

          {/* Linhas */}
          {lines.map((line, idx) => {
            const excede = line.quantidade > line.estoqueMax;
            return (
              <div key={line._id}
                className={`flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 transition-colors ${excede ? "bg-destructive/5" : "hover:bg-muted/20"}`}>
                {/* Número */}
                <span className="text-xs font-bold text-muted-foreground/50 w-5 shrink-0 tabular-nums">{idx + 1}</span>

                {/* Info produto */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{line.produtoNome}</p>
                  <p className={`text-xs mt-0.5 ${excede ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {excede
                      ? <><AlertTriangle className="inline h-3 w-3 mr-1" />Estoque insuficiente — máx. {line.estoqueMax}</>
                      : `${line.pontosPorUnidade.toLocaleString("pt-BR")} pts/un · estoque: ${line.estoqueMax}`}
                  </p>
                </div>

                {/* Controle de quantidade */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateQuantidade(line, line.quantidade - 1)}
                    className="h-7 w-7 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-bold">
                    −
                  </button>
                  <span className={`min-w-[32px] text-center text-sm font-bold tabular-nums ${excede ? "text-destructive" : ""}`}>
                    {line.quantidade}
                  </span>
                  <button onClick={() => updateQuantidade(line, line.quantidade + 1)}
                    disabled={line.quantidade >= line.estoqueMax}
                    className="h-7 w-7 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-bold disabled:opacity-25 disabled:cursor-not-allowed">
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <span className={`text-sm font-bold tabular-nums min-w-[80px] text-right ${excede ? "text-destructive" : "text-primary"}`}>
                  {(line.pontosPorUnidade * line.quantidade).toLocaleString("pt-BR")} pts
                </span>

                {/* Remover */}
                <button onClick={() => removeLine(line._id)}
                  className="shrink-0 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {/* Totais */}
          <div className="border-t border-border bg-muted/20">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Total do pedido</span>
              <span className="text-xl font-bold text-primary tabular-nums">{totalPontos.toLocaleString("pt-BR")} <span className="text-sm font-medium">pts</span></span>
            </div>

            {embaixadorId && !saldoLoading && (
              <div className={`flex items-center justify-between px-4 py-2.5 border-t border-border ${saldoInsuficiente ? "bg-destructive/5" : "bg-emerald-500/5"}`}>
                <span className="text-xs font-medium text-muted-foreground">Saldo após resgate</span>
                <div className="flex items-center gap-1.5">
                  {saldoInsuficiente && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  <span className={`text-sm font-bold tabular-nums ${saldoInsuficiente ? "text-destructive" : "text-emerald-600"}`}>
                    {saldoApos.toLocaleString("pt-BR")} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observação */}
      <div>
        <label className={lbl}>Observação (opcional)</label>
        <Input value={observacao} onChange={(e) => setObservacao(e.target.value)}
          className="bg-card text-card-foreground h-9" placeholder="Observação sobre o pedido..." />
      </div>

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        <Button className="px-14 py-3 text-base font-bold tracking-wide" onClick={handleSubmit} disabled={!podeSubmeter}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> ENVIANDO...</> : "CADASTRAR PEDIDO"}
        </Button>
      </div>
    </SimpleForm>
  );
}
