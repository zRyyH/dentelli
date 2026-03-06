"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { removeAuthCookie, canAccessAdminMenus } from "@/lib/pb";
import { Search, User, Heart, ShoppingCart, ChevronDown, Trash2, LogOut, Plus, Minus } from "lucide-react";
import { useProducts, getProductImageUrl } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "HOME", path: "/homepage" },
  { label: "RECOMPENSAS", path: "/rewards" },
  { label: "REGULAMENTO", path: "/regulation" },
  { label: "SUPORTE", path: "/support" },
  { label: "CADASTRAR", hasDropdown: true },
];

const CADASTRAR_OPTIONS = [
  { label: "Central de Pontos", path: "/cadastrar/central" },
  { label: "Indicação", path: "/cadastrar/indicacoes" },
  { label: "Pedido", path: "/cadastrar/pedido" },
  { label: "Usuário", path: "/cadastrar/usuario" },
  { label: "Estoque", path: "/cadastrar/estoque" },
];

export function SiteHeader({ activeNav }: { activeNav?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { images } = useTheme();
  const { data: products } = useProducts();
  const { items, totalPontos, itemCount, removeFromCart, updateItemQuantity } = useCart();

  const [showAdminMenus, setShowAdminMenus] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowAdminMenus(canAccessAdminMenus());
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onCartAdded = () => { setCartShake(true); setTimeout(() => setCartShake(false), 600); };
    window.addEventListener("cart-added", onCartAdded);
    return () => window.removeEventListener("cart-added", onCartAdded);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = (products || [])
    .filter((p) => p.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/rewards?busca=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); setShowSearch(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes nav-pop { 0% { transform: scale(0.55); opacity: 0; } 62% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .nav-pill { animation: nav-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards; transform-origin: center; }
      `}</style>

      <div className="relative w-full overflow-hidden bg-primary py-[7px] text-center">
        <span className="relative text-[11px] font-bold tracking-[0.22em] text-primary-foreground/90">
          ✦&nbsp;&nbsp;O MELHOR PROGRAMA DE PONTOS DA ODONTOLOGIA&nbsp;&nbsp;✦
        </span>
      </div>

      <header
        className="sticky top-0 z-50 flex h-[62px] items-center px-6 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.92)" : "white",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          boxShadow: scrolled ? "0 4px 28px rgba(0,0,0,0.07), 0 1px 0 rgba(0,0,0,0.04)" : "0 1px 0 rgba(0,0,0,0.06)",
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex shrink-0 cursor-pointer items-center" onClick={() => router.push("/homepage")}>
            {images.logo && <img src={images.logo} alt="DentelliClub" className="h-10 object-contain" />}
          </div>

          {/* Search */}
          <div className="relative hidden flex-1 justify-center md:flex" ref={searchRef}>
            <form onSubmit={handleSearch} className="w-full max-w-sm">
              <div className="flex w-full items-center rounded-full border border-border/60 bg-muted/35 px-4 py-2 transition-all focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]">
                <Search className="mr-2.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Pesquisar produtos..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                  onFocus={() => searchQuery && setShowSearch(true)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </form>
            {showSearch && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                  <button key={product.id} onClick={() => { router.push(`/produto/${product.id}`); setSearchQuery(""); setShowSearch(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted">
                    {getProductImageUrl(product) ? (
                      <img src={getProductImageUrl(product)} alt={product.nome} className="h-8 w-8 rounded-lg object-cover" />
                    ) : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm">🎁</span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.nome}</p>
                      <p className="text-xs font-semibold text-primary">{product.pontos.toLocaleString("pt-BR")} pts</p>
                    </div>
                  </button>
                )) : <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum produto encontrado</p>}
                <button onClick={handleSearch as React.MouseEventHandler}
                  className="w-full border-t border-border px-4 py-2.5 text-sm font-semibold text-primary hover:bg-muted">
                  Ver todos os resultados para &ldquo;{searchQuery}&rdquo;
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-0.5">
            {[
              { icon: User, label: "Minha Conta", path: "/my_account" },
              { icon: Heart, label: "Desejos", path: "/wishlist" },
            ].map(({ icon: Icon, label, path }) => (
              <button key={path} onClick={() => router.push(path)}
                className={`group relative hidden md:flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 ${pathname === path ? "bg-primary/10" : "hover:bg-primary/8"}`}>
                <Icon className={`h-[18px] w-[18px] ${pathname === path ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary"}`} />
                <span className={`text-[10px] font-semibold ${pathname === path ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`}>{label}</span>
              </button>
            ))}
            <button onClick={() => { removeAuthCookie(); router.push("/"); }}
              className="group relative hidden md:flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 hover:bg-primary/8 transition-all">
              <LogOut className="h-[18px] w-[18px] text-muted-foreground/70 group-hover:text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground/60 group-hover:text-primary">Sair</span>
            </button>

            {/* Cart */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger className={`group relative hidden md:flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all ${cartOpen ? "bg-primary/10" : "hover:bg-primary/8"} ${cartShake ? "animate-bounce" : ""}`}>
                  <ShoppingCart className={`h-[18px] w-[18px] ${cartOpen ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary"}`} />
                  <span className={`text-[10px] font-semibold ${cartOpen ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary"}`}>Carrinho</span>
                  {itemCount > 0 && (
                    <span className="absolute right-1 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
              </SheetTrigger>
              <SheetContent className="z-[60] flex flex-col bg-card">
                <SheetHeader><SheetTitle>Meu Carrinho</SheetTitle></SheetHeader>
                {items.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                    <ShoppingCart className="mb-4 h-16 w-16 opacity-20" />
                    <p className="text-sm font-semibold">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-3 overflow-y-auto py-4">
                      {items.map((item) => {
                        const prod = (products || []).find((p) => p.id === item.produto);
                        const img = prod ? getProductImageUrl(prod) : "";
                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {img ? <img src={img} alt={prod?.nome} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl">🎁</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{prod?.nome || "Produto"}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <button onClick={() => updateItemQuantity.mutate({ itemId: item.id, newQuantity: item.quantidade - 1 })}
                                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-[20px] text-center text-xs font-medium">{item.quantidade}</span>
                                <button onClick={() => updateItemQuantity.mutate({ itemId: item.id, newQuantity: item.quantidade + 1 })}
                                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted">
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-sm font-bold text-primary">{(item.pontos * item.quantidade).toLocaleString("pt-BR")} pts</p>
                            </div>
                            <button onClick={() => removeFromCart.mutate(item.id)}
                              className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-3 border-t border-border pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-lg font-bold text-primary">{totalPontos.toLocaleString("pt-BR")} pts</span>
                      </div>
                      <SheetClose onClick={() => router.push("/checkout")}
                        className="w-full rounded-full bg-primary py-3 text-sm font-bold tracking-wide text-primary-foreground hover:opacity-90">
                        FINALIZAR PEDIDO
                      </SheetClose>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <nav className="w-full border-b border-border/50 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-0.5 px-4 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.label;
            if (item.label === "CADASTRAR") {
              if (!showAdminMenus) return null;
              return (
                <DropdownMenu key="cadastrar">
                  <DropdownMenuTrigger className="relative flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold tracking-wide">
                      {isActive && <span className="nav-pill pointer-events-none absolute inset-0 rounded-full bg-primary shadow-sm" />}
                      <span className={`relative z-10 ${isActive ? "text-primary-foreground" : "text-foreground/65"}`}>CADASTRAR</span>
                      <ChevronDown className={`relative z-10 h-3 w-3 ${isActive ? "text-primary-foreground" : "text-foreground/65"}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-[60] border border-border bg-card shadow-xl">
                    {CADASTRAR_OPTIONS.map((opt) => (
                      <DropdownMenuItem key={opt.path} onClick={() => router.push(opt.path)} className="cursor-pointer">
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            return (
              <button key={item.label} onClick={() => item.path && router.push(item.path)}
                className={`group relative flex items-center rounded-full px-5 py-2 text-[13px] font-semibold tracking-wide transition-colors ${!isActive ? "hover:bg-primary/8 hover:text-primary" : ""}`}>
                {isActive && <span className="nav-pill pointer-events-none absolute inset-0 rounded-full bg-primary shadow-sm" />}
                <span className={`relative z-10 ${isActive ? "text-primary-foreground" : "text-foreground/65 group-hover:text-primary"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
