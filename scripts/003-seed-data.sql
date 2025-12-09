-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir usuário padrão (senha: admin123)
INSERT INTO usuarios (login, senha, nome) 
VALUES ('luvasdoisirmaos', 'admin123', 'Administrador')
ON CONFLICT (login) DO NOTHING;

-- Inserir categorias de insumos padrão
INSERT INTO insumo_categorias (nome, descricao) VALUES
('Couro', 'Couros para fabricação de luvas'),
('Linha', 'Linhas para costura'),
('Viés', 'Viés para acabamento'),
('Embalagens', 'Materiais de embalagem'),
('Elástico', 'Elásticos diversos'),
('Etiquetas', 'Etiquetas e rótulos'),
('Cola', 'Adesivos e colas'),
('Outros', 'Outros materiais')
ON CONFLICT DO NOTHING;

-- Inserir alguns produtos de exemplo
INSERT INTO produtos (nome, tipo, unidade, observacoes) VALUES
('Luva Vaqueta Cano Curto', 'Vaqueta', 'pares', 'Modelo padrão'),
('Luva Vaqueta Cano Longo', 'Vaqueta', 'pares', 'Modelo com cano estendido'),
('Luva Raspa Simples', 'Raspa', 'pares', 'Modelo econômico'),
('Luva Raspa Reforçada', 'Raspa', 'pares', 'Com reforço na palma'),
('Luva Mista', 'Mista', 'pares', 'Vaqueta + Raspa')
ON CONFLICT DO NOTHING;

-- Inserir insumos de exemplo
INSERT INTO insumos (nome, categoria_id, unidade_medida, quantidade_atual) 
SELECT 'Couro Vaqueta', id, 'm²', 100 FROM insumo_categorias WHERE nome = 'Couro'
ON CONFLICT DO NOTHING;

INSERT INTO insumos (nome, categoria_id, unidade_medida, quantidade_atual) 
SELECT 'Couro Raspa', id, 'm²', 150 FROM insumo_categorias WHERE nome = 'Couro'
ON CONFLICT DO NOTHING;

INSERT INTO insumos (nome, categoria_id, unidade_medida, cor_variacao, quantidade_atual) 
SELECT 'Linha Nylon', id, 'metros', 'Branca', 5000 FROM insumo_categorias WHERE nome = 'Linha'
ON CONFLICT DO NOTHING;

INSERT INTO insumos (nome, categoria_id, unidade_medida, cor_variacao, quantidade_atual) 
SELECT 'Viés', id, 'metros', 'Preto', 2000 FROM insumo_categorias WHERE nome = 'Viés'
ON CONFLICT DO NOTHING;

-- Inserir valores de pagamento por produção
INSERT INTO valores_producao (tipo_trabalho, valor_por_par, descricao) VALUES
('corte_vaqueta', 0.42, 'Corte de Vaqueta'),
('corte_raspa', 0.42, 'Corte de Raspa'),
('corte_punho', 0.20, 'Corte de Punho'),
('primeira_costura_fora', 0.50, 'Primeira Costura (funcionário externo)'),
('fechamento_fora', 0.50, 'Fechamento (funcionário externo)'),
('virar_luva', 0.30, 'Virar Luva')
ON CONFLICT (tipo_trabalho) DO UPDATE SET 
  valor_por_par = EXCLUDED.valor_por_par,
  descricao = EXCLUDED.descricao;
