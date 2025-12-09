-- Script para criar tabela de custos de produção
-- Executar após os scripts de criação iniciais

-- Tabela de Custos de Produção por Produto
CREATE TABLE IF NOT EXISTS custos_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  custo_couro DECIMAL(10,2) DEFAULT 0,
  custo_corte DECIMAL(10,2) DEFAULT 0,
  custo_costura DECIMAL(10,2) DEFAULT 0,
  custo_revisao DECIMAL(10,2) DEFAULT 0,
  custo_virar_luva DECIMAL(10,2) DEFAULT 0,
  custo_vies DECIMAL(10,3) DEFAULT 0,
  custo_elastico DECIMAL(10,3) DEFAULT 0,
  custo_linha DECIMAL(10,3) DEFAULT 0,
  custo_total DECIMAL(10,2) GENERATED ALWAYS AS (
    custo_couro + custo_corte + custo_costura + custo_revisao + 
    custo_virar_luva + custo_vies + custo_elastico + custo_linha
  ) STORED,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id)
);

-- Índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_custos_producao_produto ON custos_producao(produto_id);

-- Comentários das colunas
COMMENT ON TABLE custos_producao IS 'Custos de produção detalhados por produto';
COMMENT ON COLUMN custos_producao.custo_total IS 'Custo total calculado automaticamente pela soma de todos os componentes';
