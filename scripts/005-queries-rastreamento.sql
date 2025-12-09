-- =============================================
-- QUERIES ÚTEIS - RASTREAMENTO DE PRODUÇÃO
-- =============================================

-- 1. VER TODAS AS PRODUÇÕES ATIVAS (não finalizadas)
SELECT 
  pr.id,
  p.nome as produto,
  pr.quantidade,
  pr.etapa,
  l.nome as local_atual,
  pr.status,
  pr.data_inicio,
  i.nome as insumo_origem
FROM producao_rastreamento pr
LEFT JOIN produtos p ON pr.produto_id = p.id
LEFT JOIN locais_producao l ON pr.local_atual_id = l.id
LEFT JOIN insumos i ON pr.insumo_origem_id = i.id
WHERE pr.status != 'finalizado'
ORDER BY pr.data_inicio DESC;

-- 2. TOTAL DE PRODUTOS EM CADA ETAPA
SELECT 
  pr.etapa,
  COUNT(*) as total_lotes,
  SUM(pr.quantidade) as total_unidades
FROM producao_rastreamento pr
WHERE pr.status != 'finalizado'
GROUP BY pr.etapa
ORDER BY 
  CASE pr.etapa
    WHEN 'corte' THEN 1
    WHEN 'costura' THEN 2
    WHEN 'revisao' THEN 3
    WHEN 'embalagem' THEN 4
    ELSE 5
  END;

-- 3. PRODUÇÕES POR LOCAL
SELECT 
  l.nome as local,
  l.tipo,
  COUNT(pr.id) as total_lotes,
  SUM(pr.quantidade) as total_unidades
FROM locais_producao l
LEFT JOIN producao_rastreamento pr ON l.id = pr.local_atual_id AND pr.status != 'finalizado'
GROUP BY l.id, l.nome, l.tipo
ORDER BY total_unidades DESC NULLS LAST;

-- 4. HISTÓRICO COMPLETO DE UM PRODUTO ESPECÍFICO
SELECT 
  h.created_at,
  h.etapa_anterior || ' → ' || h.etapa_nova as movimentacao_etapa,
  la.nome || ' → ' || ln.nome as movimentacao_local,
  h.quantidade,
  h.observacoes
FROM producao_rastreamento_historico h
LEFT JOIN locais_producao la ON h.local_anterior_id = la.id
LEFT JOIN locais_producao ln ON h.local_novo_id = ln.id
WHERE h.rastreamento_id = 'SEU_ID_AQUI'
ORDER BY h.created_at ASC;

-- 5. PRODUÇÕES QUE ESTÃO HÁ MAIS DE 7 DIAS NA MESMA ETAPA
SELECT 
  p.nome as produto,
  pr.quantidade,
  pr.etapa,
  l.nome as local_atual,
  pr.data_inicio,
  EXTRACT(DAY FROM (NOW() - pr.data_inicio::timestamp)) as dias_na_etapa
FROM producao_rastreamento pr
LEFT JOIN produtos p ON pr.produto_id = p.id
LEFT JOIN locais_producao l ON pr.local_atual_id = l.id
WHERE pr.status != 'finalizado'
  AND pr.data_inicio < NOW() - INTERVAL '7 days'
ORDER BY dias_na_etapa DESC;

-- 6. TOTAL PRODUZIDO POR PRODUTO (últimos 30 dias)
SELECT 
  p.nome as produto,
  COUNT(pr.id) as total_lotes,
  SUM(pr.quantidade) as total_produzido
FROM producao_rastreamento pr
LEFT JOIN produtos p ON pr.produto_id = p.id
WHERE pr.status = 'finalizado'
  AND pr.data_finalizacao >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.nome
ORDER BY total_produzido DESC;

-- 7. TEMPO MÉDIO DE PRODUÇÃO POR PRODUTO
SELECT 
  p.nome as produto,
  COUNT(pr.id) as total_lotes,
  ROUND(AVG(EXTRACT(EPOCH FROM (pr.data_finalizacao::timestamp - pr.data_inicio::timestamp)) / 86400)::numeric, 2) as media_dias
FROM producao_rastreamento pr
LEFT JOIN produtos p ON pr.produto_id = p.id
WHERE pr.status = 'finalizado'
  AND pr.data_finalizacao IS NOT NULL
GROUP BY p.id, p.nome
ORDER BY media_dias DESC;

-- 8. MOVIMENTAÇÕES DO DIA
SELECT 
  h.created_at::time as hora,
  p.nome as produto,
  h.etapa_anterior || ' → ' || h.etapa_nova as movimentacao,
  la.nome as de_local,
  ln.nome as para_local,
  h.quantidade,
  h.observacoes
FROM producao_rastreamento_historico h
LEFT JOIN producao_rastreamento pr ON h.rastreamento_id = pr.id
LEFT JOIN produtos p ON pr.produto_id = p.id
LEFT JOIN locais_producao la ON h.local_anterior_id = la.id
LEFT JOIN locais_producao ln ON h.local_novo_id = ln.id
WHERE DATE(h.created_at) = CURRENT_DATE
ORDER BY h.created_at DESC;

-- 9. INSUMOS MAIS UTILIZADOS NA PRODUÇÃO
SELECT 
  i.nome as insumo,
  i.cor_variacao,
  COUNT(pr.id) as vezes_usado,
  SUM(pr.quantidade) as total_unidades_produzidas
FROM producao_rastreamento pr
LEFT JOIN insumos i ON pr.insumo_origem_id = i.id
WHERE i.id IS NOT NULL
GROUP BY i.id, i.nome, i.cor_variacao
ORDER BY vezes_usado DESC;

-- 10. DASHBOARD GERAL
SELECT 
  (SELECT COUNT(*) FROM producao_rastreamento WHERE status = 'em_processo') as em_processo,
  (SELECT COUNT(*) FROM producao_rastreamento WHERE status = 'em_transito') as em_transito,
  (SELECT COUNT(*) FROM producao_rastreamento WHERE status = 'finalizado') as finalizados,
  (SELECT SUM(quantidade) FROM producao_rastreamento WHERE status != 'finalizado') as total_unidades_wip,
  (SELECT SUM(quantidade) FROM producao_rastreamento WHERE status = 'finalizado' AND DATE(data_finalizacao) >= CURRENT_DATE - INTERVAL '30 days') as produzido_ultimos_30_dias;

-- 11. EFICIÊNCIA POR LOCAL (produções finalizadas)
SELECT 
  l.nome as local,
  COUNT(DISTINCT pr.id) as total_producoes,
  SUM(pr.quantidade) as total_unidades,
  ROUND(AVG(EXTRACT(EPOCH FROM (pr.data_finalizacao::timestamp - pr.data_inicio::timestamp)) / 86400)::numeric, 2) as media_dias_producao
FROM producao_rastreamento pr
LEFT JOIN locais_producao l ON pr.local_origem_id = l.id
WHERE pr.status = 'finalizado'
  AND pr.data_finalizacao IS NOT NULL
GROUP BY l.id, l.nome
ORDER BY total_unidades DESC;

-- 12. BUSCAR PRODUÇÕES POR INTERVALO DE DATAS
SELECT 
  pr.data_inicio::date as data,
  p.nome as produto,
  pr.quantidade,
  pr.etapa,
  l.nome as local,
  pr.status
FROM producao_rastreamento pr
LEFT JOIN produtos p ON pr.produto_id = p.id
LEFT JOIN locais_producao l ON pr.local_atual_id = l.id
WHERE pr.data_inicio::date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY pr.data_inicio DESC;

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View: Produção Ativa Completa
CREATE OR REPLACE VIEW v_producao_ativa AS
SELECT 
  pr.id,
  pr.data_inicio,
  p.nome as produto,
  pr.quantidade,
  pr.etapa,
  pr.status,
  lo.nome as local_origem,
  la.nome as local_atual,
  ld.nome as local_destino,
  i.nome as insumo,
  pr.observacoes,
  EXTRACT(DAY FROM (NOW() - pr.data_inicio::timestamp)) as dias_em_processo
FROM producao_rastreamento pr
LEFT JOIN produtos p ON pr.produto_id = p.id
LEFT JOIN locais_producao lo ON pr.local_origem_id = lo.id
LEFT JOIN locais_producao la ON pr.local_atual_id = la.id
LEFT JOIN locais_producao ld ON pr.local_destino_id = ld.id
LEFT JOIN insumos i ON pr.insumo_origem_id = i.id
WHERE pr.status != 'finalizado';

-- Usar a view:
-- SELECT * FROM v_producao_ativa ORDER BY dias_em_processo DESC;

-- =============================================
-- FUNÇÃO: Obter histórico completo de um rastreamento
-- =============================================
CREATE OR REPLACE FUNCTION get_historico_rastreamento(rastreamento_uuid UUID)
RETURNS TABLE (
  data_hora TIMESTAMP WITH TIME ZONE,
  etapa_de TEXT,
  etapa_para TEXT,
  local_de TEXT,
  local_para TEXT,
  quantidade INTEGER,
  observacoes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.created_at as data_hora,
    h.etapa_anterior as etapa_de,
    h.etapa_nova as etapa_para,
    la.nome as local_de,
    ln.nome as local_para,
    h.quantidade,
    h.observacoes
  FROM producao_rastreamento_historico h
  LEFT JOIN locais_producao la ON h.local_anterior_id = la.id
  LEFT JOIN locais_producao ln ON h.local_novo_id = ln.id
  WHERE h.rastreamento_id = rastreamento_uuid
  ORDER BY h.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Usar a função:
-- SELECT * FROM get_historico_rastreamento('seu-uuid-aqui');
