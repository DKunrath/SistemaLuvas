-- =============================================
-- RASTREAMENTO DE PRODUÇÃO POR ETAPAS E LOCAIS
-- =============================================

-- Tabela de Locais de Produção
CREATE TABLE IF NOT EXISTS locais_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- unidade_propria, atelier_terceiro
  endereco TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Rastreamento de Produção
CREATE TABLE IF NOT EXISTS producao_rastreamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id),
  quantidade INTEGER NOT NULL,
  etapa VARCHAR(50) NOT NULL, -- corte, costura, revisao, embalagem, finalizado
  local_origem_id UUID REFERENCES locais_producao(id),
  local_destino_id UUID REFERENCES locais_producao(id),
  local_atual_id UUID REFERENCES locais_producao(id),
  status VARCHAR(50) NOT NULL, -- em_processo, em_transito, finalizado
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_finalizacao TIMESTAMP WITH TIME ZONE,
  insumo_origem_id UUID REFERENCES insumos(id), -- Ex: qual tipo de couro foi usado
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Movimentação de Produção
CREATE TABLE IF NOT EXISTS producao_rastreamento_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rastreamento_id UUID REFERENCES producao_rastreamento(id) ON DELETE CASCADE,
  etapa_anterior VARCHAR(50),
  etapa_nova VARCHAR(50) NOT NULL,
  local_anterior_id UUID REFERENCES locais_producao(id),
  local_novo_id UUID REFERENCES locais_producao(id),
  quantidade INTEGER NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id)
);

-- Inserir locais padrão
INSERT INTO locais_producao (nome, tipo, observacoes) VALUES
  ('Campo Bom', 'unidade_propria', 'Unidade principal - Setor de Corte'),
  ('Estância Velha', 'unidade_propria', 'Unidade secundária - Setor de Costura'),
  ('Atelier Externo 1', 'atelier_terceiro', 'Parceiro terceirizado'),
  ('Atelier Externo 2', 'atelier_terceiro', 'Parceiro terceirizado')
ON CONFLICT DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_producao_rastreamento_produto ON producao_rastreamento(produto_id);
CREATE INDEX IF NOT EXISTS idx_producao_rastreamento_status ON producao_rastreamento(status);
CREATE INDEX IF NOT EXISTS idx_producao_rastreamento_etapa ON producao_rastreamento(etapa);
CREATE INDEX IF NOT EXISTS idx_producao_rastreamento_local_atual ON producao_rastreamento(local_atual_id);
CREATE INDEX IF NOT EXISTS idx_producao_rastreamento_historico_rastreamento ON producao_rastreamento_historico(rastreamento_id);

COMMENT ON TABLE producao_rastreamento IS 'Rastreamento de produtos em processo de produção por etapas e locais';
COMMENT ON COLUMN producao_rastreamento.etapa IS 'corte, costura, revisao, embalagem, finalizado';
COMMENT ON COLUMN producao_rastreamento.status IS 'em_processo (trabalhando), em_transito (movendo entre locais), finalizado (concluído)';
