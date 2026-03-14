"use client";

import { createContext, useContext, useState, useEffect, type ReactNode, createElement } from "react";
import { getSelectedUnidade, setSelectedUnidade, isAuthenticated } from "@/lib/pb";

interface UnidadeInfo { id: string; nome: string; }

interface UnidadeCtx {
  unidades: UnidadeInfo[];
  selectedId: string | null;
  selectedNome: string | null;
  setSelected: (id: string) => void;
}

const UnidadeContext = createContext<UnidadeCtx>({
  unidades: [],
  selectedId: null,
  selectedNome: null,
  setSelected: () => {},
});

export function UnidadeProvider({ children }: { children: ReactNode }) {
  const [unidades, setUnidades] = useState<UnidadeInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    fetch("/api/my-unidades")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: UnidadeInfo[]) => {
        if (!list.length) return;
        setUnidades(list);

        const saved = getSelectedUnidade();
        const valid = list.find((u) => u.id === saved);
        const initial = valid ? valid.id : list[0].id;
        setSelectedUnidade(initial);
        setSelectedId(initial);
      });
  }, []);

  const setSelected = (id: string) => {
    setSelectedUnidade(id);
    setSelectedId(id);
  };

  const selectedNome = unidades.find((u) => u.id === selectedId)?.nome ?? null;

  return createElement(
    UnidadeContext.Provider,
    { value: { unidades, selectedId, selectedNome, setSelected } },
    children
  );
}

export function useUnidade() {
  return useContext(UnidadeContext);
}
