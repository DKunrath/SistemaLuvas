-- =============================================
-- SISTEMA LUVAS DOIS IRMÃOS - LIMPEZA COMPLETA
-- =============================================
-- ATENÇÃO: Este script apaga TODOS os dados!
-- Use apenas se quiser resetar o banco completamente
-- =============================================

-- Remover todas as tabelas (em ordem reversa de dependência)
DROP TABLE IF EXISTS contas_receber CASCADE;
DROP TABLE IF EXISTS contas_pagar CASCADE;
DROP TABLE IF EXISTS pagamentos_couro_nf CASCADE;
DROP TABLE IF EXISTS pagamentos_couro CASCADE;
DROP TABLE IF EXISTS compras_couro CASCADE;
DROP TABLE IF EXISTS producao_costura CASCADE;
DROP TABLE IF EXISTS controle_costura CASCADE;
DROP TABLE IF EXISTS producao_corte CASCADE;
DROP TABLE IF EXISTS controle_corte CASCADE;
DROP TABLE IF EXISTS estoque_produto_movimentacoes CASCADE;
DROP TABLE IF EXISTS estoque_produtos CASCADE;
DROP TABLE IF EXISTS insumo_movimentacoes CASCADE;
DROP TABLE IF EXISTS insumos CASCADE;
DROP TABLE IF EXISTS insumo_categorias CASCADE;
DROP TABLE IF EXISTS pedido_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Remover índices (caso ainda existam)
DROP INDEX IF EXISTS idx_producao_costura_funcionaria;
DROP INDEX IF EXISTS idx_producao_costura_data;
DROP INDEX IF EXISTS idx_producao_corte_funcionario;
DROP INDEX IF EXISTS idx_producao_corte_data;
DROP INDEX IF EXISTS idx_pagamentos_couro_nf_data;
DROP INDEX IF EXISTS idx_pagamentos_couro_data;
DROP INDEX IF EXISTS idx_compras_couro_data;
DROP INDEX IF EXISTS idx_costura_funcionario;
DROP INDEX IF EXISTS idx_costura_data;
DROP INDEX IF EXISTS idx_corte_data;
DROP INDEX IF EXISTS idx_movimentacoes_insumo;
DROP INDEX IF EXISTS idx_insumos_categoria;
DROP INDEX IF EXISTS idx_pedidos_data;
DROP INDEX IF EXISTS idx_pedidos_status;
DROP INDEX IF EXISTS idx_pedidos_cliente;

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Todas as tabelas e índices foram removidos com sucesso!';
    RAISE NOTICE 'Agora você pode executar o script 001-create-tables.sql para recriar tudo.';
END $$;
