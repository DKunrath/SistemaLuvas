-- Tabela para compras de couro da Victor Luvas
CREATE TABLE IF NOT EXISTS victor_compras_couro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  quantidade_metros DECIMAL(10,2) NOT NULL CHECK (quantidade_metros > 0),
  tipo_couro VARCHAR(50) NOT NULL,
  classe_couro VARCHAR(50) NOT NULL,
  preco_couro DECIMAL(10,2) NOT NULL CHECK (preco_couro >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE victor_compras_couro IS 'Registro de compras de couro da Victor Luvas';
COMMENT ON COLUMN victor_compras_couro.data IS 'Data da compra';
COMMENT ON COLUMN victor_compras_couro.quantidade_metros IS 'Quantidade em metros quadrados ou kg';
COMMENT ON COLUMN victor_compras_couro.tipo_couro IS 'Tipo de couro (Raspa, Vaqueta, etc.)';
COMMENT ON COLUMN victor_compras_couro.classe_couro IS 'Classe do couro';
COMMENT ON COLUMN victor_compras_couro.preco_couro IS 'Preço do couro';

-- Tabela para controle de produção da Victor Luvas
CREATE TABLE IF NOT EXISTS victor_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES victor_compras_couro(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  unidade VARCHAR(20) NOT NULL,
  tipo_luva VARCHAR(100) NOT NULL,
  rendimento DECIMAL(10,2) CHECK (rendimento >= 0),
  custo DECIMAL(10,2) CHECK (custo >= 0),
  situacao VARCHAR(20) NOT NULL CHECK (situacao IN ('Cortando', 'Costurando', 'Pronto', 'Enviado', 'Entregue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE victor_producao IS 'Controle de produção de luvas da Victor Luvas';
COMMENT ON COLUMN victor_producao.compra_id IS 'Referência para a compra de couro utilizada';
COMMENT ON COLUMN victor_producao.quantidade IS 'Quantidade produzida';
COMMENT ON COLUMN victor_producao.unidade IS 'Unidade de medida (pares, dúzias, etc.)';
COMMENT ON COLUMN victor_producao.tipo_luva IS 'Tipo de luva produzida';
COMMENT ON COLUMN victor_producao.rendimento IS 'Rendimento da produção';
COMMENT ON COLUMN victor_producao.custo IS 'Custo total da produção';
COMMENT ON COLUMN victor_producao.situacao IS 'Situação atual da produção';

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_victor_compras_data ON victor_compras_couro(data DESC);
CREATE INDEX IF NOT EXISTS idx_victor_producao_compra ON victor_producao(compra_id);
CREATE INDEX IF NOT EXISTS idx_victor_producao_situacao ON victor_producao(situacao);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_victor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS victor_compras_updated_at ON victor_compras_couro;
CREATE TRIGGER victor_compras_updated_at
  BEFORE UPDATE ON victor_compras_couro
  FOR EACH ROW
  EXECUTE FUNCTION update_victor_updated_at();

DROP TRIGGER IF EXISTS victor_producao_updated_at ON victor_producao;
CREATE TRIGGER victor_producao_updated_at
  BEFORE UPDATE ON victor_producao
  FOR EACH ROW
  EXECUTE FUNCTION update_victor_updated_at();
