"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleForm } from "@/components/simple-form";
import { SearchSelect } from "@/components/search-select";
import { useEstoques, useProdutosAdmin } from "@/hooks/use-admin-data";
import { useUnidade } from "@/hooks/use-unidade";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

type TipoFluxo = "ENTRADA" | "SAIDA";

interface MovRow {
  _id: string;
  produtoId: string;
  quantidade: string;
  nomeLote: string;
  custoUnitario: string;
  observacao: string;
  status?: "success" | "error";
  error?: string;
}

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

function makeRow(): MovRow {
  return { _id: `${Date.now()}-${Math.random()}`, produtoId: "", quantidade: "1", nomeLote: "", custoUnitario: "0,00", observacao: "" };
}

export default function EstoquePage() {
  const [tipoFluxo, setTipoFluxo] = useState<TipoFluxo>("ENTRADA");
  const [unidadeId, setUnidadeId] = useState("");
  const [rows, setRows] = useState<MovRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);

  const { unidades } = useUnidade();
  const { data: produtos = [], isLoading: loadingProdutos } = useProdutosAdmin();
  const { data: estoques = [] } = useEstoques(unidadeId);

  const unidadeOptions = useMemo(() => unidades.map((u) => ({ id: u.id, label: u.nome })), [unidades]);

  const produtosEntrada = useMemo(() => produtos.map((p) => ({ id: p.id, label: p.nome })), [produtos]);
  const produtosSaida = useMemo(() =>
    produtos
      .filter((p) => estoques.some((e) => e.produto_id === p.id && e.quantidade > 0))
      .map((p) => {
        const est = estoques.find((e) => e.produto_id === p.id);
        return { id: p.id, label: p.nome, suffix: `${est?.quantidade ?? 0} un` };
      }),
    [produtos, estoques]);

  const produtoOptions = tipoFluxo === "ENTRADA" ? produtosEntrada : produtosSaida;

  const handleTipoChange = (v: TipoFluxo) => {
    setTipoFluxo(v);
    setRows([makeRow()]);
  };

  const handleUnidadeChange = (id: string) => {
    setUnidadeId(id);
    setRows([makeRow()]);
  };

  const updateRow = (id: string, patch: Partial<MovRow>) =>
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r));

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const handleSubmit = async () => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return; }
    for (const row of rows) {
      if (!row.produtoId) { toast.error("Selecione o produto em todas as movimentações"); return; }
      if (!row.quantidade || parseInt(row.quantidade) < 1) { toast.error("Informe uma quantidade válida em todas as movimentações"); return; }
      if (tipoFluxo === "SAIDA") {
        const est = estoques.find((e) => e.produto_id === row.produtoId)?.quantidade ?? 0;
        if (parseInt(row.quantidade) > est) { toast.error(`Quantidade excede o estoque disponível (${est} un)`); return; }
      }
      if (tipoFluxo === "ENTRADA" && !row.nomeLote.trim()) { toast.error("Informe o nome do lote em todas as entradas"); return; }
      if (tipoFluxo === "ENTRADA") {
        const custo = parseFloat(row.custoUnitario.replace(/\./g, "").replace(",", ".")) || 0;
        if (custo <= 0) { toast.error("Custo unitário deve ser maior que zero em todas as entradas"); return; }
      }
    }

    setSubmitting(true);
    const unidadeNome = unidades.find((u) => u.id === unidadeId)?.nome ?? "";
    let errors = 0;

    const updated = await Promise.all(rows.map(async (row) => {
      const body: any = {
        tipo: tipoFluxo,
        unidadeId,
        produtoId: row.produtoId,
        quantidade: parseInt(row.quantidade) || 1,
        produto: produtos.find((p) => p.id === row.produtoId) ?? { id: row.produtoId },
        unidade: { id: unidadeId, nome: unidadeNome },
      };
      if (tipoFluxo === "ENTRADA") {
        body.nomeLote = row.nomeLote;
        body.custoUnitario = row.custoUnitario;
      } else {
        body.observacao = row.observacao;
      }

      try {
        const res = await fetch("/api/admin/estoque", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          errors++;
          return { ...row, status: "error" as const, error: (d as any).error || "Erro" };
        }
        return { ...row, status: "success" as const };
      } catch {
        errors++;
        return { ...row, status: "error" as const, error: "Erro na requisição" };
      }
    }));

    setRows(updated);
    setSubmitting(false);

    if (errors === 0) {
      toast.success(`${rows.length} movimentação(ões) cadastrada(s) com sucesso!`);
      setRows([makeRow()]);
    } else {
      toast.error(`${errors} de ${rows.length} movimentação(ões) falharam.`);
    }
  };

  return (
    <SimpleForm title="ESTOQUE">
      {/* Tipo + Unidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className={lbl}>Tipo de movimentação</label>
          <Tabs value={tipoFluxo} onValueChange={(v) => handleTipoChange(v as TipoFluxo)}>
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="ENTRADA" className="flex-1">ENTRADA</TabsTrigger>
              <TabsTrigger value="SAIDA" className="flex-1">SAÍDA</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          <label className={lbl}>Unidade <span className="text-destructive">*</span></label>
          <SearchSelect
            value={unidadeId}
            onChange={handleUnidadeChange}
            options={unidadeOptions}
            placeholder="Selecione uma unidade"
            loading={unidades.length === 0}
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const usedIds = rows.filter((r) => r._id !== row._id && r.produtoId).map((r) => r.produtoId);
          const availableOptions = produtoOptions.filter((o) => !usedIds.includes(o.id));
          return (
          <MovRow
            key={row._id}
            row={row}
            idx={idx}
            total={rows.length}
            tipo={tipoFluxo}
            unidadeId={unidadeId}
            produtoOptions={availableOptions}
            estoques={estoques}
            loadingProdutos={loadingProdutos}
            onUpdate={(patch) => updateRow(row._id, patch)}
            onRemove={() => removeRow(row._id)}
          />
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button type="button" variant="outline" size="sm"
          onClick={addRow} disabled={!unidadeId}
          className="border-dashed border-primary text-primary hover:bg-primary/5">
          <Plus className="h-4 w-4 mr-1.5" /> NOVA MOVIMENTAÇÃO
        </Button>
      </div>

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        <Button className="px-14 py-3 text-base font-bold tracking-wide"
          onClick={handleSubmit}
          disabled={submitting || !unidadeId || rows.length === 0}>
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> ENVIANDO...</>
            : `${tipoFluxo === "ENTRADA" ? "CADASTRAR ENTRADAS" : "CADASTRAR SAÍDAS"}${rows.length > 1 ? ` (${rows.length})` : ""}`}
        </Button>
      </div>
    </SimpleForm>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────
interface MovRowProps {
  row: MovRow;
  idx: number;
  total: number;
  tipo: TipoFluxo;
  unidadeId: string;
  produtoOptions: { id: string; label: string; suffix?: string }[];
  estoques: { produto_id: string; quantidade: number }[];
  loadingProdutos: boolean;
  onUpdate: (patch: Partial<MovRow>) => void;
  onRemove: () => void;
}

function MovRow({ row, idx, total, tipo, unidadeId, produtoOptions, estoques, loadingProdutos, onUpdate, onRemove }: MovRowProps) {
  const estoqueAtual = estoques.find((e) => e.produto_id === row.produtoId)?.quantidade ?? 0;

  const custoTotal = (() => {
    const cu = parseFloat(row.custoUnitario.replace(/\./g, "").replace(",", ".")) || 0;
    return (cu * (parseFloat(row.quantidade) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  })();

  const statusIcon = row.status === "success"
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    : row.status === "error"
    ? <XCircle className="h-4 w-4 text-destructive shrink-0" />
    : null;

  return (
    <div className={`rounded-lg border p-4 space-y-3 transition-colors ${
      row.status === "success" ? "border-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-950/10"
      : row.status === "error" ? "border-destructive/40 bg-destructive/5"
      : "border-border bg-card/30"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {tipo === "ENTRADA" ? "Entrada" : "Saída"} {idx + 1}
          </span>
          {row.error && <span className="text-xs text-destructive">{row.error}</span>}
        </div>
        {total > 1 && row.status !== "success" && (
          <button type="button" onClick={onRemove}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {tipo === "ENTRADA" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nome do lote <span className="text-destructive">*</span></label>
              <Input
                placeholder="Descrição do lote"
                value={row.nomeLote}
                onChange={(e) => onUpdate({ nomeLote: e.target.value })}
                className={inp}
                disabled={row.status === "success"}
              />
            </div>
            <div>
              <label className={lbl}>Produto <span className="text-destructive">*</span></label>
              <SearchSelect
                value={row.produtoId}
                onChange={(v) => onUpdate({ produtoId: v })}
                options={produtoOptions}
                placeholder={!unidadeId ? "Selecione a unidade primeiro" : "Selecione um produto"}
                disabled={!unidadeId || row.status === "success"}
                loading={loadingProdutos}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Custo unitário <span className="text-destructive">*</span></label>
              <Input
                value={row.custoUnitario}
                onChange={(e) => onUpdate({ custoUnitario: formatCurrency(e.target.value) })}
                className={inp}
                disabled={row.status === "success"}
              />
            </div>
            <div>
              <label className={lbl}>Quantidade <span className="text-destructive">*</span></label>
              <Input
                type="number" min="1"
                value={row.quantidade}
                onChange={(e) => onUpdate({ quantidade: e.target.value.replace(/[^0-9]/g, "") })}
                className={inp}
                disabled={row.status === "success"}
              />
            </div>
            <div>
              <label className={lbl}>Custo total</label>
              <Input value={custoTotal} readOnly className="bg-muted text-muted-foreground h-9 cursor-not-allowed" />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_6rem_6rem] gap-3 items-end">
            <div>
              <label className={lbl}>Produto <span className="text-destructive">*</span></label>
              <SearchSelect
                value={row.produtoId}
                onChange={(v) => onUpdate({ produtoId: v })}
                options={produtoOptions}
                placeholder={!unidadeId ? "Selecione a unidade primeiro" : "Selecione um produto"}
                disabled={!unidadeId || row.status === "success"}
                loading={loadingProdutos}
              />
            </div>
            <div>
              <label className={lbl}>Quantidade <span className="text-destructive">*</span></label>
              <Input
                type="number" min="1" max={row.produtoId ? estoqueAtual : undefined}
                value={row.quantidade}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 1;
                  onUpdate({ quantidade: String(Math.min(v, row.produtoId ? estoqueAtual : v)) });
                }}
                className={inp}
                disabled={row.status === "success"}
              />
              {row.produtoId && parseInt(row.quantidade) > estoqueAtual && (
                <p className="text-xs text-destructive mt-1">Máximo: {estoqueAtual} un</p>
              )}
            </div>
            <div>
              <label className={lbl}>Estoque</label>
              <Input value={row.produtoId ? estoqueAtual : ""} readOnly className={`${inp} cursor-not-allowed`} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observação</label>
            <Textarea
              value={row.observacao}
              onChange={(e) => onUpdate({ observacao: e.target.value })}
              className="bg-card text-card-foreground resize-y"
              disabled={row.status === "success"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
