"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface SearchSelectOption {
  id: string;
  label: string;
  searchText?: string; // extra text to match against (e.g. email, cpf, telefone)
}

interface SearchSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchSelect({ value, onChange, options, placeholder = "Selecione...", disabled, className }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.searchText && o.searchText.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selected = options.find((o) => o.id === value);

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

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground shadow-sm transition-colors hover:bg-accent/30 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${open ? "ring-1 ring-ring" : ""}`}
      >
        <span className={selected ? "" : "text-muted-foreground"}>{selected?.label ?? placeholder}</span>
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
            {filtered.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Nenhum resultado</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false); }}
                  className={`flex w-full items-center px-3 py-2 text-sm text-popover-foreground text-left hover:bg-primary hover:text-primary-foreground transition-colors ${value === o.id ? "bg-primary/10 font-medium" : ""}`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
