-- Script para adicionar campo tamanho na tabela produtos
-- Executar após os scripts de criação iniciais

-- Adiciona a coluna tamanho na tabela produtos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS tamanho VARCHAR(10);

-- Comentário da coluna
COMMENT ON COLUMN produtos.tamanho IS 'Tamanho da luva (ex: P, M, G, GG, 7, 8, 9, etc)';
