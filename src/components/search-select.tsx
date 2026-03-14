"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface SearchSelectOption {
  id: string;
  label: string;
  searchText?: string; // extra text to match against (e.g. email, cpf, telefone)
  suffix?: string; // secondary info shown on the right (e.g. "5 em estoque")
}

interface SearchSelectBase {
  options: SearchSelectOption[];
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

interface SearchSelectSingle extends SearchSelectBase {
  multi?: false;
  value: string;
  onChange: (v: string) => void;
  values?: never;
  onChangeMulti?: never;
}

interface SearchSelectMulti extends SearchSelectBase {
  multi: true;
  values: string[];
  onChangeMulti: (v: string[]) => void;
  value?: never;
  onChange?: never;
}

type SearchSelectProps = SearchSelectSingle | SearchSelectMulti;

export function SearchSelect(props: SearchSelectProps) {
  const { options, placeholder = "Selecione...", loading, disabled, className } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isMulti = props.multi === true;
  const selectedIds: string[] = isMulti ? props.values : props.value ? [props.value] : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.searchText && o.searchText.toLowerCase().includes(q))
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (id: string) => {
    if (isMulti) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      props.onChangeMulti(next);
      // keep open for multi
    } else {
      props.onChange(id);
      setOpen(false);
    }
  };

  const triggerLabel = (() => {
    if (isMulti) {
      if (!selectedIds.length) return null;
      if (selectedIds.length === 1) {
        return options.find((o) => o.id === selectedIds[0])?.label ?? null;
      }
      return `${selectedIds.length} selecionadas`;
    }
    return options.find((o) => o.id === props.value)?.label ?? null;
  })();

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground shadow-sm transition-colors hover:bg-accent/30 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${open ? "ring-1 ring-ring" : ""}`}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Carregando...
          </span>
        ) : (
          <span className={triggerLabel ? "" : "text-muted-foreground"}>{triggerLabel ?? placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center border-b border-border px-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1.5" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-9 w-full bg-transparent text-sm text-popover-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Nenhum resultado</p>
            ) : (
              filtered.map((o) => {
                const isSelected = selectedIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelect(o.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm text-popover-foreground text-left hover:bg-primary hover:text-primary-foreground transition-colors ${isSelected ? "bg-primary/10 font-medium" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {isMulti && (
                        <Check className={`h-3.5 w-3.5 shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} />
                      )}
                      {o.label}
                    </span>
                    {o.suffix && <span className="ml-3 shrink-0 text-xs opacity-60">{o.suffix}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
