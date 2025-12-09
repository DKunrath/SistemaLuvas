-- Tabela para custos de produção específicos da Victor Luvas
CREATE TABLE IF NOT EXISTS victor_custos_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  custo_couro DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_corte DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_costura DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_revisao DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_virar_luva DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_vies DECIMAL(10,3) NOT NULL DEFAULT 0,
  custo_elastico DECIMAL(10,3) NOT NULL DEFAULT 0,
  custo_linha DECIMAL(10,2) NOT NULL DEFAULT 0,
  custo_total DECIMAL(10,2) GENERATED ALWAYS AS (
    custo_couro + custo_corte + custo_costura + custo_revisao + 
    custo_virar_luva + custo_vies + custo_elastico + custo_linha
  ) STORED,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id)
);

COMMENT ON TABLE victor_custos_producao IS 'Custos de produção específicos para produtos da Victor Luvas';
COMMENT ON COLUMN victor_custos_producao.produto_id IS 'Referência ao produto';
COMMENT ON COLUMN victor_custos_producao.custo_couro IS 'Custo do couro por par';
COMMENT ON COLUMN victor_custos_producao.custo_corte IS 'Custo do corte por par';
COMMENT ON COLUMN victor_custos_producao.custo_costura IS 'Custo da costura por par';
COMMENT ON COLUMN victor_custos_producao.custo_revisao IS 'Custo da revisão por par';
COMMENT ON COLUMN victor_custos_producao.custo_virar_luva IS 'Custo de virar luva por par';
COMMENT ON COLUMN victor_custos_producao.custo_vies IS 'Custo do viés por par';
COMMENT ON COLUMN victor_custos_producao.custo_elastico IS 'Custo do elástico por par';
COMMENT ON COLUMN victor_custos_producao.custo_linha IS 'Custo da linha por par';
COMMENT ON COLUMN victor_custos_producao.custo_total IS 'Custo total calculado automaticamente';

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_victor_custos_produto ON victor_custos_producao(produto_id);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS victor_custos_updated_at ON victor_custos_producao;
CREATE TRIGGER victor_custos_updated_at
  BEFORE UPDATE ON victor_custos_producao
  FOR EACH ROW
  EXECUTE FUNCTION update_victor_updated_at();
