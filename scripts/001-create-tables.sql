-- =============================================
-- SISTEMA LUVAS DOIS IRMÃOS - CRIAÇÃO DE TABELAS
-- =============================================

-- Tabela de Usuários do Sistema (autenticação simples)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(20),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos (Luvas)
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL, -- Vaqueta, Raspa, Mista, etc.
  codigo_interno VARCHAR(50),
  unidade VARCHAR(20) DEFAULT 'pares',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  telefone VARCHAR(20),
  setor VARCHAR(100), -- Corte, Costura, Embalagem, etc.
  funcao VARCHAR(100),
  tipo_funcionario VARCHAR(20) DEFAULT 'interno', -- interno (salário fixo semanal) ou externo (pagamento por produção)
  data_admissao DATE,
  salario DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido SERIAL,
  cliente_id UUID REFERENCES clientes(id),
  data_pedido DATE DEFAULT CURRENT_DATE,
  data_entrega DATE,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_producao, pronto, entregue, cancelado
  valor_total DECIMAL(12,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2),
  subtotal DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Categorias de Insumos
CREATE TABLE IF NOT EXISTS insumo_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Insumos (Matéria-Prima)
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  categoria_id UUID REFERENCES insumo_categorias(id),
  unidade_medida VARCHAR(50) NOT NULL, -- m², kg, metros, unidades, pacotes
  cor_variacao VARCHAR(100),
  quantidade_atual DECIMAL(12,3) DEFAULT 0,
  quantidade_minima DECIMAL(12,3) DEFAULT 0,
  lote VARCHAR(50),
  data_validade DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Movimentações de Insumos
CREATE TABLE IF NOT EXISTS insumo_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insumo_id UUID REFERENCES insumos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- entrada, saida
  quantidade DECIMAL(12,3) NOT NULL,
  quantidade_anterior DECIMAL(12,3),
  quantidade_posterior DECIMAL(12,3),
  motivo TEXT,
  referencia_id UUID, -- pode referenciar pedido, corte, etc.
  referencia_tipo VARCHAR(50), -- pedido, corte, ajuste, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id)
);

-- Tabela de Estoque de Produtos Acabados
CREATE TABLE IF NOT EXISTS estoque_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id),
  quantidade INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Movimentações de Estoque de Produtos
CREATE TABLE IF NOT EXISTS estoque_produto_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id),
  tipo VARCHAR(20) NOT NULL, -- entrada, saida
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER,
  quantidade_posterior INTEGER,
  motivo TEXT,
  referencia_id UUID,
  referencia_tipo VARCHAR(50), -- producao, pedido, ajuste
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id)
);

-- Tabela de Controle de Corte
CREATE TABLE IF NOT EXISTS controle_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id),
  data DATE NOT NULL,
  metros_couro DECIMAL(10,3) NOT NULL, -- m² de couro entregue
  pares_cortados INTEGER NOT NULL,
  rendimento DECIMAL(6,3), -- pares por m² (calculado)
  tipo_couro VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produção de Corte (nova)
CREATE TABLE IF NOT EXISTS producao_corte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id),
  data_producao DATE NOT NULL,
  metros_couro_entregues DECIMAL(10,3) NOT NULL, -- m² de couro entregue
  pares_cortados INTEGER NOT NULL,
  rendimento DECIMAL(6,3), -- pares por m² (calculado: pares / metros)
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Controle de Costura
CREATE TABLE IF NOT EXISTS controle_costura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id),
  produto_id UUID REFERENCES produtos(id),
  data DATE NOT NULL,
  pares_produzidos INTEGER NOT NULL,
  etapa VARCHAR(50) NOT NULL, -- primeira_costura, segunda_costura, fechamento, revisao, embalado
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produção de Costura (nova - registro diário por funcionária)
CREATE TABLE IF NOT EXISTS producao_costura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionaria_id UUID REFERENCES funcionarios(id),
  data_producao DATE NOT NULL,
  primeira_costura INTEGER DEFAULT 0,
  segunda_costura INTEGER DEFAULT 0,
  fechamento INTEGER DEFAULT 0,
  revisao INTEGER DEFAULT 0,
  embalado INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Compras de Couro
CREATE TABLE IF NOT EXISTS compras_couro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_couro VARCHAR(100) NOT NULL,
  metros DECIMAL(10,3) NOT NULL, -- m²
  classe VARCHAR(50),
  qtd_pacotes INTEGER,
  preco_unitario DECIMAL(10,2),
  valor_total DECIMAL(12,2),
  data_compra DATE NOT NULL,
  fornecedor VARCHAR(255),
  numero_pedido VARCHAR(50),
  local_observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pagamentos de Couro (NFs)
CREATE TABLE IF NOT EXISTS pagamentos_couro_nf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_nf VARCHAR(50) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  cliente VARCHAR(255),
  data_pagamento DATE NOT NULL,
  situacao VARCHAR(50) DEFAULT 'pendente', -- pendente, entregue, aceite
  data_emissao DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
  categoria VARCHAR(100),
  fornecedor VARCHAR(255),
  funcionario_id UUID REFERENCES funcionarios(id), -- Link para pagamento de funcionário
  referencia_tipo VARCHAR(50), -- producao_corte, producao_costura, etc.
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contas a Receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, recebido, atrasado, cancelado
  cliente_id UUID REFERENCES clientes(id),
  pedido_id UUID REFERENCES pedidos(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações de Valores de Pagamento por Produção
CREATE TABLE IF NOT EXISTS valores_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_trabalho VARCHAR(100) NOT NULL UNIQUE, -- corte_vaqueta, corte_raspa, corte_punho, primeira_costura_fora, fechamento_fora, virar_luva
  valor_por_par DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_insumo ON insumo_movimentacoes(insumo_id);
CREATE INDEX IF NOT EXISTS idx_corte_data ON controle_corte(data);
CREATE INDEX IF NOT EXISTS idx_costura_data ON controle_costura(data);
CREATE INDEX IF NOT EXISTS idx_costura_funcionario ON controle_costura(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_compras_couro_data ON compras_couro(data_compra);
CREATE INDEX IF NOT EXISTS idx_pagamentos_couro_nf_data ON pagamentos_couro_nf(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_producao_corte_data ON producao_corte(data_producao);
CREATE INDEX IF NOT EXISTS idx_producao_corte_funcionario ON producao_corte(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_producao_costura_data ON producao_costura(data_producao);
CREATE INDEX IF NOT EXISTS idx_producao_costura_funcionaria ON producao_costura(funcionaria_id);

