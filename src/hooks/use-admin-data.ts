import { useQuery } from "@tanstack/react-query";
import type { Unidade, Embaixador, Coletor, Missao, Relacao, EstoqueItem, SaldoData, Pedido, Indicacao } from "@/lib/types";

const get = (url: string) =>
  fetch(url).then((r) => { if (!r.ok) throw new Error(); return r.json(); });

export const useUnidades = () =>
  useQuery<Unidade[]>({
    queryKey: ["unidades"],
    queryFn: () => get("/api/admin/unidades"),
  });

export const useEmbaixadores = (unidadeId?: string) =>
  useQuery<Embaixador[]>({
    queryKey: ["embaixadores", unidadeId || "all"],
    queryFn: () => get(unidadeId ? `/api/admin/embaixadores?unidadeId=${unidadeId}` : "/api/admin/embaixadores"),
    enabled: unidadeId ? !!unidadeId : true,
  });

export const useAllColetores = () =>
  useQuery<Coletor[]>({
    queryKey: ["coletores-all"],
    queryFn: () => get("/api/admin/coletores"),
  });

export const useColetores = (unidadeId?: string) =>
  useQuery<Coletor[]>({
    queryKey: ["coletores", unidadeId || "all"],
    queryFn: () => get(unidadeId ? `/api/admin/coletores?unidadeId=${unidadeId}` : "/api/admin/coletores"),
    enabled: unidadeId ? !!unidadeId : true,
  });

export const useMissoes = () =>
  useQuery<Missao[]>({
    queryKey: ["missoes"],
    queryFn: () => get("/api/admin/missoes"),
  });

export const useIndicacoes = () =>
  useQuery<Indicacao[]>({
    queryKey: ["indicacoes"],
    queryFn: () => get("/api/admin/indicacoes"),
  });

export const useRelacoes = () =>
  useQuery<Relacao[]>({
    queryKey: ["relacoes"],
    queryFn: () => get("/api/admin/relacoes"),
  });

export const useSaldoEmbaixador = (usuarioId: string) =>
  useQuery<SaldoData>({
    queryKey: ["saldo-embaixador", usuarioId],
    queryFn: () => get(`/api/admin/saldo-embaixador?usuarioId=${usuarioId}`),
    enabled: !!usuarioId,
  });

export const usePedidosPendentes = (embaixadorId: string) =>
  useQuery<Pedido[]>({
    queryKey: ["pedidos-pendentes", embaixadorId],
    queryFn: () => get(`/api/admin/pedidos-pendentes?embaixadorId=${embaixadorId}`),
    enabled: !!embaixadorId,
  });

export const useEstoques = (unidadeId: string) =>
  useQuery<EstoqueItem[]>({
    queryKey: ["estoque", unidadeId],
    queryFn: () => get(`/api/admin/estoques?unidadeId=${unidadeId}`),
    enabled: !!unidadeId,
  });

export const useProdutosAdmin = () =>
  useQuery<{ id: string; nome: string; pontos: number }[]>({
    queryKey: ["produtos-admin"],
    queryFn: () => get("/api/admin/produtos"),
  });

export const useTipoOptions = () =>
  useQuery<string[]>({
    queryKey: ["tipo-options"],
    queryFn: () => get("/api/admin/tipo-options"),
  });

export const useCategorias = () =>
  useQuery({
    queryKey: ["categorias"],
    queryFn: () => get("/api/admin/categorias"),
  });
