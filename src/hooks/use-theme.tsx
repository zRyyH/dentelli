"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PB_BASE_URL, fetchWithAuth } from "@/lib/pb";
import type { ThemeColors, ThemeImages, TemaRecord } from "@/lib/types";

interface ThemeCtx {
  colors: ThemeColors;
  images: ThemeImages;
  ready: boolean;
}

const Ctx = createContext<ThemeCtx>({
  colors: { primary: "#1a1a1a", secondary: "#1a1a1a", accent: "#1a1a1a" },
  images: { logo: null, icone: null, banner: null, banners_secundarios: [], novidades: null, categorias: {} },
  ready: false,
});

const LS_KEY = "site-theme";


function applyColors(colors: ThemeColors) {
  const el = document.documentElement;
  el.style.setProperty("--primary", colors.primary);
  el.style.setProperty("--secondary", colors.secondary);
  el.style.setProperty("--accent", colors.accent);
  el.style.setProperty("--primary-foreground", "oklch(1 0 0)");
  el.style.setProperty("--secondary-foreground", "oklch(1 0 0)");
  el.style.setProperty("--accent-foreground", "oklch(1 0 0)");
  el.style.setProperty("--gradient-bg", `linear-gradient(180deg, ${colors.primary} 0%, ${colors.secondary} 100%)`);
}

function buildFileUrl(record: TemaRecord, filename: string) {
  return `${PB_BASE_URL}/api/files/${record.collectionName}/${record.id}/${filename}`;
}

function parseImages(record: TemaRecord): ThemeImages {
  const toUrl = (f: string) => buildFileUrl(record, f);

  const banners = Array.isArray(record.banners_secundarios)
    ? record.banners_secundarios.map(toUrl)
    : record.banners_secundarios ? [toUrl(record.banners_secundarios)] : [];

  const categorias: Record<string, string> = {};
  const cats = Array.isArray(record.categorias) ? record.categorias : record.categorias ? [record.categorias] : [];
  cats.forEach((f: string) => {
    const name = f.replace(/\.[^/.]+$/, "");
    categorias[name] = toUrl(f);
  });

  return {
    logo: record.logo ? toUrl(record.logo) : null,
    icone: record.icone ? toUrl(record.icone) : null,
    banner: record.banner ? toUrl(record.banner) : null,
    banners_secundarios: banners,
    novidades: record.novidades ? toUrl(record.novidades) : null,
    categorias,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const DEFAULT_COLORS: ThemeColors = { primary: "#1a1a1a", secondary: "#1a1a1a", accent: "#1a1a1a" };
  const DEFAULT_IMAGES: ThemeImages = { logo: null, icone: null, banner: null, banners_secundarios: [], novidades: null, categorias: {} };

  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [images, setImages] = useState<ThemeImages>(DEFAULT_IMAGES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        const { colors: c, images: i } = JSON.parse(cached);
        if (c && i) { setColors(c); setImages(i); applyColors(c); setReady(true); }
      }
    } catch {}
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${PB_BASE_URL}/api/collections/tema/records?perPage=1`);
      if (!res.ok) return;
      const data = await res.json();
      const record: TemaRecord = data.items?.[0];
      if (!record) return;

      const newColors: ThemeColors = {
        primary: record.primary || "#1a1a1a",
        secondary: record.secondary || "#1a1a1a",
        accent: record.accent || "#1a1a1a",
      };
      const newImages = parseImages(record);
      setColors(newColors);
      setImages(newImages);
      applyColors(newColors);
      try { localStorage.setItem(LS_KEY, JSON.stringify({ colors: newColors, images: newImages })); } catch {}
    } catch {}
    finally { setReady(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Ctx.Provider value={{ colors, images, ready }}>
      {!ready ? (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", zIndex: 9999 }}>
          <div style={{ width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#6b7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
