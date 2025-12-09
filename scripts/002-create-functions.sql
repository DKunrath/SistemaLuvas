-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE OR REPLACE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_insumos_updated_at BEFORE UPDATE ON insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_estoque_produtos_updated_at BEFORE UPDATE ON estoque_produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_controle_corte_updated_at BEFORE UPDATE ON controle_corte FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_controle_costura_updated_at BEFORE UPDATE ON controle_costura FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_compras_couro_updated_at BEFORE UPDATE ON compras_couro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_pagamentos_couro_nf_updated_at BEFORE UPDATE ON pagamentos_couro_nf FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_producao_corte_updated_at BEFORE UPDATE ON producao_corte FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_producao_costura_updated_at BEFORE UPDATE ON producao_costura FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON contas_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular rendimento do corte
CREATE OR REPLACE FUNCTION calcular_rendimento_corte()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metros_couro > 0 THEN
    NEW.rendimento = NEW.pares_cortados::DECIMAL / NEW.metros_couro;
  ELSE
    NEW.rendimento = 0;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_calcular_rendimento
BEFORE INSERT OR UPDATE ON controle_corte
FOR EACH ROW EXECUTE FUNCTION calcular_rendimento_corte();

-- Trigger para producao_corte
CREATE OR REPLACE FUNCTION calcular_rendimento_producao_corte()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.metros_couro_entregues > 0 THEN
    NEW.rendimento = NEW.pares_cortados::DECIMAL / NEW.metros_couro_entregues;
  ELSE
    NEW.rendimento = 0;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_calcular_rendimento_producao
BEFORE INSERT OR UPDATE ON producao_corte
FOR EACH ROW EXECUTE FUNCTION calcular_rendimento_producao_corte();

-- Função para atualizar estoque de insumos
CREATE OR REPLACE FUNCTION atualizar_estoque_insumo()
RETURNS TRIGGER AS $$
BEGIN
  -- Guarda quantidade anterior
  SELECT quantidade_atual INTO NEW.quantidade_anterior 
  FROM insumos WHERE id = NEW.insumo_id;
  
  -- Calcula nova quantidade
  IF NEW.tipo = 'entrada' THEN
    UPDATE insumos 
    SET quantidade_atual = quantidade_atual + NEW.quantidade 
    WHERE id = NEW.insumo_id;
  ELSE
    UPDATE insumos 
    SET quantidade_atual = quantidade_atual - NEW.quantidade 
    WHERE id = NEW.insumo_id;
  END IF;
  
  -- Guarda quantidade posterior
  SELECT quantidade_atual INTO NEW.quantidade_posterior 
  FROM insumos WHERE id = NEW.insumo_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_atualizar_estoque_insumo
BEFORE INSERT ON insumo_movimentacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_insumo();

-- Função para atualizar estoque de produtos
CREATE OR REPLACE FUNCTION atualizar_estoque_produto()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se existe registro no estoque
  INSERT INTO estoque_produtos (produto_id, quantidade)
  VALUES (NEW.produto_id, 0)
  ON CONFLICT (produto_id) DO NOTHING;
  
  -- Guarda quantidade anterior
  SELECT quantidade INTO NEW.quantidade_anterior 
  FROM estoque_produtos WHERE produto_id = NEW.produto_id;
  
  -- Atualiza quantidade
  IF NEW.tipo = 'entrada' THEN
    UPDATE estoque_produtos 
    SET quantidade = quantidade + NEW.quantidade 
    WHERE produto_id = NEW.produto_id;
  ELSE
    UPDATE estoque_produtos 
    SET quantidade = quantidade - NEW.quantidade 
    WHERE produto_id = NEW.produto_id;
  END IF;
  
  -- Guarda quantidade posterior
  SELECT quantidade INTO NEW.quantidade_posterior 
  FROM estoque_produtos WHERE produto_id = NEW.produto_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_atualizar_estoque_produto
BEFORE INSERT ON estoque_produto_movimentacoes
FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_produto();

-- Adicionar constraint unique para estoque_produtos
ALTER TABLE estoque_produtos ADD CONSTRAINT unique_produto_estoque UNIQUE (produto_id);

-- Função para obter saldo de couro
CREATE OR REPLACE FUNCTION get_saldo_couro()
RETURNS TABLE (
  total_compras DECIMAL,
  total_pagamentos DECIMAL,
  saldo DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(valor_total) FROM compras_couro), 0) as total_compras,
    COALESCE((SELECT SUM(valor) FROM pagamentos_couro_nf), 0) as total_pagamentos,
    COALESCE((SELECT SUM(valor_total) FROM compras_couro), 0) - 
    COALESCE((SELECT SUM(valor) FROM pagamentos_couro_nf), 0) as saldo;
END;
$$ language 'plpgsql';
