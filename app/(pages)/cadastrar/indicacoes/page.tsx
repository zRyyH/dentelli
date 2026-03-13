"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SearchSelect } from "@/components/search-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleForm } from "@/components/simple-form";
import { useEmbaixadores, useUnidades, useAllColetores, useRelacoes } from "@/hooks/use-admin-data";
import { toast } from "sonner";
import { formatTelefone, validateTelefone } from "@/lib/formatters";

// ─── Masked input hook ──────────────────────────────────────────────────────
function useMaskedInput(formatter: (v: string) => string) {
  const ref = useRef<HTMLInputElement>(null);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, cursor).replace(/\D/g, "").length;
    const formatted = formatter(input.value);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      let count = 0;
      let pos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (count >= digitsBeforeCursor) { pos = i; break; }
        if (/\d/.test(formatted[i])) count++;
      }
      ref.current.setSelectionRange(pos, pos);
    });
    return formatted;
  };
  return { ref, onChange };
}


// ─── Types ───────────────────────────────────────────────────────────────────
interface IndicacaoRow {
  _id: string;
  embaixadorId: string;
  nome: string;
  telefone: string;
  relacaoId: string;
  status?: "pending" | "success" | "error";
  error?: string;
}

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
const inp = "bg-card text-card-foreground h-9";

function makeRow(): IndicacaoRow {
  return { _id: `${Date.now()}-${Math.random()}`, embaixadorId: "", nome: "", telefone: "", relacaoId: "" };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function IndicacoesPage() {
  const [coletorId, setColetorId] = useState("");
  const [rows, setRows] = useState<IndicacaoRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);

  const { data: coletores = [] } = useAllColetores();
  const { data: relacoes = [] } = useRelacoes();
  const { data: unidades = [] } = useUnidades();

  const coletorSelecionado = useMemo(() => coletores.find((c) => c.id === coletorId), [coletorId, coletores]);
  const unidadeId = (coletorSelecionado as any)?.unidade || "";
  const unidadeNome = useMemo(() => unidades.find((u: any) => u.id === unidadeId)?.nome || "", [unidadeId, unidades]);
  const { data: embaixadores = [] } = useEmbaixadores(unidadeId || undefined);

  const coletorOptions = useMemo(() => coletores.map((c) => ({ id: c.id, label: c.nome })), [coletores]);
  const embaixadorOptions = useMemo(() => embaixadores.map((e) => ({ id: e.id, label: e.nome })), [embaixadores]);
  const relacaoOptions = useMemo(() => relacoes.map((r) => ({ id: r.id, label: (r as any).nome })), [relacoes]);

  // Reset embaixador nos rows quando unidade muda
  useEffect(() => {
    setRows((prev) => prev.map((r) => ({ ...r, embaixadorId: "" })));
  }, [unidadeId]);

  const updateRow = (id: string, patch: Partial<IndicacaoRow>) =>
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r));

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const validateRows = (): boolean => {
    if (!coletorId) { toast.error("Selecione um coletor"); return false; }

    const phones = new Set<string>();
    for (const row of rows) {
      if (!row.embaixadorId) { toast.error("Selecione o embaixador em todas as indicações"); return false; }
      if (!row.nome.trim()) { toast.error("Preencha o nome em todas as indicações"); return false; }
      if (!row.telefone || !validateTelefone(row.telefone)) { toast.error("Telefone inválido em uma das indicações"); return false; }
      if (!row.relacaoId) { toast.error("Selecione a relação em todas as indicações"); return false; }
      const digits = row.telefone.replace(/\D/g, "");
      if (phones.has(digits)) { toast.error(`Telefone duplicado: ${row.telefone}`); return false; }
      phones.add(digits);
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateRows()) return;
    setSubmitting(true);

    const coletor = coletores.find((c) => c.id === coletorId) ?? { id: coletorId };
    let errors = 0;

    const updated = await Promise.all(
      rows.map(async (row) => {
        const embaixador = embaixadores.find((e) => e.id === row.embaixadorId) ?? { id: row.embaixadorId };
        const relacao = relacoes.find((r) => r.id === row.relacaoId) ?? { id: row.relacaoId };
        try {
          const res = await fetch("/api/admin/indicacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: row.nome, telefone: row.telefone.replace(/\D/g, ""),
              relacaoId: row.relacaoId, embaixadorId: row.embaixadorId, coletorId,
              coletor, embaixador, relacao,
              unidade: { id: unidadeId, nome: unidadeNome },
            }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            const msg = (d as any).error || "Erro";
            errors++;
            return { ...row, status: "error" as const, error: msg };
          }
          return { ...row, status: "success" as const };
        } catch {
          errors++;
          return { ...row, status: "error" as const, error: "Erro na requisição" };
        }
      })
    );

    setRows(updated);
    setSubmitting(false);

    if (errors === 0) {
      toast.success(`${rows.length} indicação(ões) cadastrada(s) com sucesso!`);
      setRows([makeRow()]);
      setColetorId("");
    } else {
      toast.error(`${errors} de ${rows.length} indicação(ões) falharam.`);
    }
  };

  return (
    <SimpleForm title="CADASTRAR INDICAÇÃO">
      {/* Coletor — fixo para todos os rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Coletor <span className="text-destructive">*</span></label>
          <SearchSelect
            value={coletorId}
            onChange={(v) => { setColetorId(v); }}
            options={coletorOptions}
            placeholder="Selecione um coletor"
          />
        </div>
        <div>
          <label className={lbl}>Unidade</label>
          <Input value={unidadeNome} readOnly className={`${inp} cursor-not-allowed`} placeholder="..." />
        </div>
      </div>

      <hr className="border-border" />

      {/* Rows de indicações */}
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <IndicacaoRowForm
            key={row._id}
            row={row}
            idx={idx}
            total={rows.length}
            embaixadorOptions={embaixadorOptions}
            relacaoOptions={relacaoOptions}
            coletorSelecionado={!!coletorId}
            onUpdate={(patch) => updateRow(row._id, patch)}
            onRemove={() => removeRow(row._id)}
          />
        ))}
      </div>

      {/* Botão adicionar row */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={!coletorId}
          className="border-dashed border-primary text-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4 mr-1.5" /> NOVA INDICAÇÃO
        </Button>
      </div>

      <hr className="border-border" />

      <div className="flex justify-center pt-2">
        <Button
          className="px-14 py-3 text-base font-bold tracking-wide"
          onClick={handleSubmit}
          disabled={submitting || !coletorId || rows.length === 0}
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> ENVIANDO...</> : `CADASTRAR ${rows.length > 1 ? `(${rows.length})` : ""}`}
        </Button>
      </div>
    </SimpleForm>
  );
}

// ─── Row form component ───────────────────────────────────────────────────────
interface RowProps {
  row: IndicacaoRow;
  idx: number;
  total: number;
  embaixadorOptions: { id: string; label: string }[];
  relacaoOptions: { id: string; label: string }[];
  coletorSelecionado: boolean;
  onUpdate: (patch: Partial<IndicacaoRow>) => void;
  onRemove: () => void;
}

function IndicacaoRowForm({ row, idx, total, embaixadorOptions, relacaoOptions, coletorSelecionado, onUpdate, onRemove }: RowProps) {
  const telefoneInput = useMaskedInput(formatTelefone);

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
      {/* Header da row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Indicação {idx + 1}</span>
          {row.error && <span className="text-xs text-destructive">{row.error}</span>}
        </div>
        {total > 1 && row.status !== "success" && (
          <button type="button" onClick={onRemove}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Embaixador */}
      <div>
        <label className={lbl}>Embaixador <span className="text-destructive">*</span></label>
        <SearchSelect
          value={row.embaixadorId}
          onChange={(v) => onUpdate({ embaixadorId: v })}
          options={embaixadorOptions}
          placeholder="Selecione um embaixador"
          disabled={!coletorSelecionado || embaixadorOptions.length === 0}
        />
        {!coletorSelecionado && (
          <p className="text-xs text-muted-foreground mt-1">Selecione um coletor primeiro</p>
        )}
      </div>

      {/* Nome, Telefone, Relação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Nome <span className="text-destructive">*</span></label>
          <Input
            value={row.nome}
            onChange={(e) => onUpdate({ nome: e.target.value })}
            placeholder="Nome da indicação"
            className="bg-background h-9"
            disabled={row.status === "success"}
          />
        </div>
        <div>
          <label className={lbl}>Telefone <span className="text-destructive">*</span></label>
          <Input
            ref={telefoneInput.ref}
            value={row.telefone}
            onChange={(e) => onUpdate({ telefone: telefoneInput.onChange(e) })}
            placeholder="(XX) XXXXX-XXXX"
            className="bg-background h-9"
            disabled={row.status === "success"}
          />
          {row.telefone && !validateTelefone(row.telefone) && (
            <p className="text-xs text-destructive mt-1">Telefone inválido</p>
          )}
        </div>
        <div>
          <label className={lbl}>Relação <span className="text-destructive">*</span></label>
          <SearchSelect
            value={row.relacaoId}
            onChange={(v) => onUpdate({ relacaoId: v })}
            options={relacaoOptions}
            placeholder="Selecione uma relação"
            disabled={row.status === "success"}
          />
        </div>
      </div>
    </div>
  );
}
