"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SearchSelect } from "@/components/search-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleForm } from "@/components/simple-form";
import { useEmbaixadores, useColetores, useRelacoes } from "@/hooks/use-admin-data";
import { useUnidade } from "@/hooks/use-unidade";
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
  nome: string;
  telefone: string;
  relacaoId: string;
  status?: "pending" | "success" | "error";
  error?: string;
}

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

function makeRow(): IndicacaoRow {
  return { _id: `${Date.now()}-${Math.random()}`, nome: "", telefone: "", relacaoId: "" };
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function IndicacoesPage() {
  const [unidadeId, setUnidadeId] = useState("");
  const [coletorId, setColetorId] = useState("");
  const [embaixadorId, setEmbaixadorId] = useState("");
  const [rows, setRows] = useState<IndicacaoRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);

  const { unidades: minhasUnidades } = useUnidade();

  const { data: coletores = [], isLoading: loadingColetores } = useColetores(unidadeId || undefined);
  const { data: embaixadores = [], isLoading: loadingEmb } = useEmbaixadores(unidadeId || undefined);
  const { data: relacoes = [], isLoading: loadingRelacoes } = useRelacoes();

  const unidadeNome = useMemo(() => minhasUnidades.find((u) => u.id === unidadeId)?.nome || "", [unidadeId, minhasUnidades]);

  const unidadeOptions = useMemo(() => minhasUnidades.map((u) => ({ id: u.id, label: u.nome })), [minhasUnidades]);
  const coletorOptions = useMemo(() => coletores.map((c) => ({ id: c.id, label: c.nome })), [coletores]);
  const embaixadorOptions = useMemo(() => embaixadores.map((e) => ({ id: e.id, label: e.nome })), [embaixadores]);
  const relacaoOptions = useMemo(() => relacoes.map((r) => ({ id: r.id, label: (r as any).nome })), [relacoes]);

  useEffect(() => { setColetorId(""); setEmbaixadorId(""); setRows([makeRow()]); }, [unidadeId]);
  useEffect(() => { setEmbaixadorId(""); }, [coletorId]);

  const updateRow = (id: string, patch: Partial<IndicacaoRow>) =>
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r));

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const hasDuplicatePhone = (() => {
    const phones = rows.map((r) => r.telefone.replace(/\D/g, "")).filter((d) => d.length >= 10);
    return phones.length !== new Set(phones).size;
  })();

  const validateRows = (): boolean => {
    if (!unidadeId) { toast.error("Selecione uma unidade"); return false; }
    if (!coletorId) { toast.error("Selecione um coletor"); return false; }
    if (!embaixadorId) { toast.error("Selecione um embaixador"); return false; }
    const phones = new Set<string>();
    for (const row of rows) {
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
    const embaixador = embaixadores.find((e) => e.id === embaixadorId) ?? { id: embaixadorId };
    let errors = 0;

    const updated = await Promise.all(
      rows.map(async (row) => {
        const relacao = relacoes.find((r) => r.id === row.relacaoId) ?? { id: row.relacaoId };
        try {
          const res = await fetch("/api/admin/indicacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: row.nome, telefone: row.telefone.replace(/\D/g, ""),
              relacaoId: row.relacaoId, embaixadorId, coletorId,
              coletor, embaixador, relacao,
              unidade: { id: unidadeId, nome: unidadeNome },
            }),
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
      })
    );

    setRows(updated);
    setSubmitting(false);

    if (errors === 0) {
      toast.success(`${rows.length} indicação(ões) cadastrada(s) com sucesso!`);
      setRows([makeRow()]);
      setColetorId("");
      setEmbaixadorId("");
      setUnidadeId("");
    } else {
      toast.error(`${errors} de ${rows.length} indicação(ões) falharam.`);
    }
  };

  return (
    <SimpleForm title="CADASTRAR INDICAÇÃO">
      {/* Unidade + Coletor + Embaixador — definidos uma única vez */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={lbl}>Unidade <span className="text-destructive">*</span></label>
          <SearchSelect
            value={unidadeId}
            onChange={setUnidadeId}
            options={unidadeOptions}
            placeholder="Selecione uma unidade"
            loading={minhasUnidades.length === 0}
          />
        </div>
        <div>
          <label className={lbl}>Coletor <span className="text-destructive">*</span></label>
          <SearchSelect
            value={coletorId}
            onChange={setColetorId}
            options={coletorOptions}
            placeholder={!unidadeId ? "Selecione a unidade primeiro" : "Selecione um coletor"}
            disabled={!unidadeId}
            loading={loadingColetores}
          />
        </div>
        <div>
          <label className={lbl}>Embaixador <span className="text-destructive">*</span></label>
          <SearchSelect
            value={embaixadorId}
            onChange={setEmbaixadorId}
            options={embaixadorOptions}
            placeholder={!unidadeId ? "Selecione a unidade primeiro" : "Selecione um embaixador"}
            disabled={!unidadeId}
            loading={loadingEmb}
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Rows de indicações */}
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const otherPhones = rows
            .filter((r) => r._id !== row._id && r.telefone)
            .map((r) => r.telefone.replace(/\D/g, ""));
          return (
            <IndicacaoRowForm
              key={row._id}
              row={row}
              idx={idx}
              total={rows.length}
              relacaoOptions={relacaoOptions}
              loadingRelacoes={loadingRelacoes}
              otherPhones={otherPhones}
              onUpdate={(patch) => updateRow(row._id, patch)}
              onRemove={() => removeRow(row._id)}
            />
          );
        })}
      </div>

      {/* Botão adicionar row */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={!unidadeId || !coletorId || !embaixadorId}
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
          disabled={submitting || !unidadeId || !coletorId || !embaixadorId || rows.length === 0 || hasDuplicatePhone}
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
  relacaoOptions: { id: string; label: string }[];
  loadingRelacoes?: boolean;
  otherPhones: string[];
  onUpdate: (patch: Partial<IndicacaoRow>) => void;
  onRemove: () => void;
}

function IndicacaoRowForm({ row, idx, total, relacaoOptions, loadingRelacoes, otherPhones, onUpdate, onRemove }: RowProps) {
  const telefoneInput = useMaskedInput(formatTelefone);
  const digits = row.telefone.replace(/\D/g, "");
  const isDuplicate = digits.length >= 10 && otherPhones.includes(digits);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Nome <span className="text-destructive">*</span></label>
          <Input
            value={row.nome}
            onChange={(e) => onUpdate({ nome: e.target.value })}
            placeholder="Nome da indicação"
            className="bg-card text-card-foreground h-9"
            disabled={row.status === "success"}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Telefone <span className="text-destructive">*</span></label>
          <Input
            ref={telefoneInput.ref}
            value={row.telefone}
            onChange={(e) => onUpdate({ telefone: telefoneInput.onChange(e) })}
            placeholder="(XX) XXXXX-XXXX"
            className="bg-card text-card-foreground h-9"
            disabled={row.status === "success"}
          />
          {row.telefone && !validateTelefone(row.telefone) && (
            <p className="text-xs text-destructive mt-1">Telefone inválido</p>
          )}
          {isDuplicate && (
            <p className="text-xs text-destructive mt-1">Telefone já usado em outra indicação</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Relação <span className="text-destructive">*</span></label>
          <SearchSelect
            value={row.relacaoId}
            onChange={(v) => onUpdate({ relacaoId: v })}
            options={relacaoOptions}
            placeholder="Selecione uma relação"
            disabled={row.status === "success"}
            loading={loadingRelacoes}
          />
        </div>
      </div>
    </div>
  );
}
