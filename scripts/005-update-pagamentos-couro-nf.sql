-- Script para atualizar campos da tabela pagamentos_couro_nf
-- Executar após os scripts de criação iniciais

-- Remove a coluna situacao (não é mais necessária, sempre será PAG COURO)
ALTER TABLE pagamentos_couro_nf 
DROP COLUMN IF EXISTS situacao;

-- Renomeia data_emissao para empresa_emissora
ALTER TABLE pagamentos_couro_nf 
RENAME COLUMN data_emissao TO empresa_emissora;

-- Altera o tipo da coluna empresa_emissora para VARCHAR
ALTER TABLE pagamentos_couro_nf 
ALTER COLUMN empresa_emissora TYPE VARCHAR(255);

-- Adiciona comentários às colunas
COMMENT ON COLUMN pagamentos_couro_nf.data_pagamento IS 'Data em que a nota fiscal foi tirada/emitida';
COMMENT ON COLUMN pagamentos_couro_nf.empresa_emissora IS 'Nome da empresa que emitiu a nota fiscal';
