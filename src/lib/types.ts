export interface Product {
  id: string;
  collectionId: string;
  collectionName: string;
  nome: string;
  descricao: string;
  pontos: number;
  foto: string | string[];
  categoria: string;
  ativo: boolean;
  created: string;
  updated: string;
}

export interface Categoria {
  id: string;
  collectionId: string;
  collectionName: string;
  nome: string;
  foto: string;
}

export interface CartItem {
  id: string;
  quantidade: number;
  pontos: number;
  produto: string;
}

export interface Pedido {
  id: string;
  usuario: string;
  item: string[];
  pontos: number;
  status: string;
  created: string;
  updated: string;
  observacao?: string;
}

export interface PedidoItem {
  id: string;
  produto: string;
  quantidade: number;
  pontos: number;
}

export interface Desejo {
  id: string;
  produto: string;
  usuario: string;
}

export interface HistoricoItem {
  id: string;
  created: string;
  tipo: "CREDITO" | "DEBITO";
  saldo: number;
  valor: number;
  observacao: string;
  valido_ate: string;
  missao_nome: string;
  missao_pontos: number;
  pedido_id: string;
  pedido_status: string;
  pedido_pontos: number;
}

export interface SaldoData {
  credito: number;
  debito: number;
  saldo: number;
  pendente?: number;
}

export interface Unidade {
  id: string;
  nome: string;
}

export interface Embaixador {
  id: string;
  nome: string;
  embaixador: boolean;
  unidade?: string;
  tipo?: string;
  prontuario?: string;
}

export interface Coletor {
  id: string;
  nome: string;
  coletor: boolean;
  unidade?: string;
}

export interface Missao {
  id: string;
  missao: string;
  criterio: string;
  pontos: number;
  automatico: boolean;
  categoria: "PROGRESSAO" | "PROVA_SOCIAL" | "INDICACAO" | "FEEDBACK" | "PESSOAL";
}

export interface Indicacao {
  id: string;
  nome: string;
  telefone: string;
  relacao: string;
  usuario_embaixador: string;
  usuario_coletor: string;
}

export interface Relacao {
  id: string;
  nome: string;
}

export interface EstoqueItem {
  id: string;
  produto: string;
  unidade: string;
  quantidade: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ThemeImages {
  logo: string | null;
  icone: string | null;
  banner: string | null;
  banners_secundarios: string[];
  novidades: string | null;
  categorias: Record<string, string>;
}

export interface TemaRecord {
  id: string;
  collectionName: string;
  primary: string;
  secondary: string;
  accent: string;
  logo?: string;
  icone?: string;
  banner?: string;
  banners_secundarios?: string | string[];
  novidades?: string;
  categorias?: string | string[];
  regulamento?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  informacao?: string | Record<string, unknown>;
}

export type WebhookTipo = "CENTRAL_DE_PONTOS" | "INDICACAO" | "PEDIDO" | "USUARIO" | "ESTOQUE";
