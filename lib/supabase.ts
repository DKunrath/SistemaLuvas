import { createBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Types for database tables
export interface Usuario {
  id: string
  login: string
  nome: string
  ativo: boolean
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  cpf_cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
  ativo: boolean
  created_at: string
}

export interface Produto {
  id: string
  nome: string
  tipo: string
  tamanho?: string
  codigo_interno?: string
  unidade: string
  observacoes?: string
  ativo: boolean
  created_at: string
}

export interface Funcionario {
  id: string
  nome: string
  cpf?: string
  telefone?: string
  setor?: string
  funcao?: string
  tipo_funcionario?: "interno" | "externo"
  data_admissao?: string
  salario?: number
  ativo: boolean
  created_at: string
}

export interface Pedido {
  id: string
  numero_pedido: number
  cliente_id: string
  data_pedido: string
  data_entrega?: string
  status: string
  valor_total: number
  observacoes?: string
  created_at: string
  cliente?: Cliente
}

export interface PedidoItem {
  id: string
  pedido_id: string
  produto_id: string
  quantidade: number
  preco_unitario?: number
  subtotal?: number
  produto?: Produto
}

export interface InsumoCategoria {
  id: string
  nome: string
  descricao?: string
}

export interface Insumo {
  id: string
  nome: string
  categoria_id: string
  unidade_medida: string
  cor_variacao?: string
  quantidade_atual: number
  quantidade_minima: number
  lote?: string
  data_validade?: string
  observacoes?: string
  ativo: boolean
  categoria?: InsumoCategoria
}

export interface InsumoMovimentacao {
  id: string
  insumo_id: string
  tipo: "entrada" | "saida"
  quantidade: number
  quantidade_anterior?: number
  quantidade_posterior?: number
  motivo?: string
  created_at: string
  insumo?: Insumo
}

export interface EstoqueProduto {
  id: string
  produto_id: string
  quantidade: number
  produto?: Produto
}

export interface ControleCorte {
  id: string
  funcionario_id: string
  data: string
  metros_couro: number
  pares_cortados: number
  rendimento: number
  tipo_couro?: string
  observacoes?: string
  funcionario?: Funcionario
}

export interface ProducaoCorte {
  id: string
  funcionario_id: string
  data_producao: string
  metros_couro_entregues: number
  pares_cortados: number
  rendimento: number
  observacoes?: string
  created_at: string
  funcionario?: Funcionario
}

export interface ControleCostura {
  id: string
  funcionario_id: string
  produto_id: string
  data: string
  pares_produzidos: number
  etapa: string
  observacoes?: string
  funcionario?: Funcionario
  produto?: Produto
}

export interface ProducaoCostura {
  id: string
  funcionaria_id: string
  data_producao: string
  primeira_costura: number
  segunda_costura: number
  fechamento: number
  revisao: number
  embalado: number
  created_at: string
  funcionaria?: Funcionario
}

export interface CompraCouro {
  id: string
  tipo_couro: string
  metros: number
  classe?: string
  qtd_pacotes?: number
  preco_unitario?: number
  valor_total: number
  data_compra: string
  fornecedor?: string
  numero_pedido?: string
  local_observacoes?: string
  created_at: string
}

export interface PagamentoCouroNF {
  id: string
  numero_nf: string
  valor: number
  cliente?: string
  data_pagamento: string
  situacao: "pendente" | "entregue" | "aceite"
  data_emissao?: string
  created_at: string
}

export interface ContaPagar {
  id: string
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: string
  categoria?: string
  fornecedor?: string
  funcionario_id?: string
  referencia_tipo?: string
  observacoes?: string
  funcionario?: Funcionario
}

export interface ContaReceber {
  id: string
  descricao: string
  valor: number
  data_vencimento: string
  data_recebimento?: string
  status: string
  cliente_id?: string
  pedido_id?: string
  observacoes?: string
  cliente?: Cliente
}

export interface ValorProducao {
  id: string
  tipo_trabalho: string
  valor_por_par: number
  descricao?: string
  ativo: boolean
  created_at: string
}

export interface CustoProducao {
  id: string
  produto_id: string
  custo_couro: number
  custo_corte: number
  custo_costura: number
  custo_revisao: number
  custo_virar_luva: number
  custo_vies: number
  custo_elastico: number
  custo_linha: number
  custo_total: number
  observacoes?: string
  created_at: string
  updated_at: string
  produto?: Produto
}

export interface VictorCompraCouro {
  id: string
  data: string
  quantidade_metros: number
  tipo_couro: string
  classe_couro: string
  preco_couro: number
  created_at: string
  updated_at: string
}

export interface VictorProducao {
  id: string
  compra_id: string
  quantidade: number
  unidade: string
  tipo_luva: string
  rendimento?: number
  custo?: number
  situacao: 'Cortando' | 'Costurando' | 'Pronto' | 'Enviado' | 'Entregue'
  created_at: string
  updated_at: string
  compra?: VictorCompraCouro
}

export interface VictorCustoProducao {
  id: string
  produto_id: string
  custo_couro: number
  custo_corte: number
  custo_costura: number
  custo_revisao: number
  custo_virar_luva: number
  custo_vies: number
  custo_elastico: number
  custo_linha: number
  custo_total: number
  observacoes?: string
  created_at: string
  updated_at: string
  produto?: Produto
}

export interface LocalProducao {
  id: string
  nome: string
  tipo: "unidade_propria" | "atelier_terceiro"
  endereco?: string
  observacoes?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ProducaoRastreamento {
  id: string
  produto_id: string
  quantidade: number
  etapa: "corte" | "costura" | "revisao" | "embalagem" | "finalizado"
  local_origem_id?: string
  local_destino_id?: string
  local_atual_id?: string
  status: "em_processo" | "em_transito" | "finalizado"
  data_inicio: string
  data_finalizacao?: string
  insumo_origem_id?: string
  observacoes?: string
  created_at: string
  updated_at: string
  produto?: Produto
  local_origem?: LocalProducao
  local_destino?: LocalProducao
  local_atual?: LocalProducao
  insumo_origem?: Insumo
}

export interface ProducaoRastreamentoHistorico {
  id: string
  rastreamento_id: string
  etapa_anterior?: string
  etapa_nova: string
  local_anterior_id?: string
  local_novo_id?: string
  quantidade: number
  observacoes?: string
  created_at: string
  created_by?: string
  local_anterior?: LocalProducao
  local_novo?: LocalProducao
}
