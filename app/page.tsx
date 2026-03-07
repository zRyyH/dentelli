"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isAuthenticated, setAuthCookie, setUserData } from "@/lib/pb";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { images } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) { router.replace("/homepage"); return; }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(raf);
  }, [router]);

  const anim = (delay = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Email ou senha incorretos");
      }
      const data = await res.json();
      setAuthCookie(data.token);
      setUserData(data.record);
      router.replace("/homepage");
    } catch (err: any) {
      toast.error(err.message || "Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[56%] relative overflow-hidden flex-col items-center justify-center p-16"
        style={{ background: "var(--gradient-bg)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1.2px, transparent 1.2px)", backgroundSize: "36px 36px" }} />
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          {images.icone ? (
            <img src={images.icone} alt="Logo" className="h-28 object-contain mb-10 drop-shadow-2xl" style={anim(80)} />
          ) : (
            <div className="w-28 h-28 rounded-full mb-10" style={{ background: "rgba(255,255,255,0.15)", ...anim(80) }} />
          )}
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4" style={anim(180)}>
            Bem-vindo ao<br /><span style={{ opacity: 0.75 }}>Dentelli Club</span>
          </h1>
          <p className="text-white/55 text-base leading-relaxed max-w-xs" style={anim(260)}>
            Acumule pontos, conquiste prêmios e transforme sorrisos em grandes experiências.
          </p>
          <div className="flex items-center gap-3 mt-12" style={anim(340)}>
            <div className="h-px w-10 bg-white/25" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="h-px w-10 bg-white/25" />
          </div>
          <div className="mt-10 flex gap-10" style={anim(400)}>
            {[{ label: "Membros", value: "10k+" }, { label: "Prêmios", value: "500+" }, { label: "Unidades", value: "20+" }].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-white/45 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 md:px-14 relative">
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, hsl(var(--primary)/0.06), transparent 70%)" }} />
        <div className="relative z-10 w-full max-w-[360px]">
          <div className="mb-10" style={anim(60)}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">Portal do Membro</p>
            <h2 className="text-3xl font-black text-foreground tracking-tight leading-tight">Acesse sua<br />conta</h2>
            <p className="text-muted-foreground mt-2.5 text-sm">Informe suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div style={anim(160)}>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 pl-10 bg-muted/40 border-border/50" />
              </div>
            </div>

            <div style={anim(230)}>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input type={showSenha ? "text" : "password"} placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required className="h-12 pl-10 pr-11 bg-muted/40 border-border/50" />
                <button type="button" onClick={() => setShowSenha((v) => !v)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2" style={anim(300)}>
              <Button type="submit" disabled={loading} className="w-full h-12 text-[13px] font-bold tracking-[0.15em]">
                {loading ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    ENTRANDO...
                  </span>
                ) : "ENTRAR"}
              </Button>
            </div>
          </form>

          <p className="mt-10 text-center text-[11px] text-muted-foreground/50" style={anim(380)}>
            © {new Date().getFullYear()} Dentelli Club. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
