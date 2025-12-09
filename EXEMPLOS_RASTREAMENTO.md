# 📖 Exemplos Práticos - Rastreamento de Produção

## Cenário 1: Produção Simples em Um Local

### Situação
Produzir 1000 pares de Luva Raspa AB em Campo Bom, do início ao fim.

### Passos

#### 1. Iniciar Produção
```
Menu: Rastreamento Produção > Nova Produção

Produto: Luva Raspa AB
Quantidade: 1000
Etapa Inicial: corte
Local: Campo Bom
Insumo Origem: Raspa AB
Observações: Lote L001

[Iniciar Produção]
```

**Resultado**: Produção criada, status "em_processo", etapa "corte"

#### 2. Avançar para Costura
```
Ação: Movimentar

Nova Etapa: costura
Local de Destino: Campo Bom
Observações: Corte finalizado

[Movimentar]
```

**Resultado**: Etapa mudou para "costura"

#### 3. Finalizar
```
Ação: Finalizar

[Confirmar Finalização]
```

**Resultado**: 
- ✅ 1000 pares adicionados ao Estoque de Produtos
- ✅ Insumo "Raspa AB" baixado do estoque
- ✅ Status = "finalizado"

---

## Cenário 2: Produção Multi-Local (Seu Caso)

### Situação
2000 pares de Luva Vaqueta - Corte em Campo Bom, Costura em Estância Velha.

### Passos

#### Dia 1 - Iniciar Corte em Campo Bom
```
Menu: Rastreamento Produção > Nova Produção

Produto: Luva Vaqueta
Quantidade: 2000
Etapa Inicial: corte
Local: Campo Bom
Insumo Origem: Vaqueta AB (20m²)
Observações: Lote L002 - Pedido #1234

[Iniciar Produção]
```

**Estado Atual**:
```
Produto: Luva Vaqueta
Quantidade: 2000 pares
Etapa: corte
Local: Campo Bom
Status: em_processo
Estoque Vaqueta AB: NÃO baixado ainda ⚠️
```

#### Dia 3 - Enviar para Costura em Estância Velha
```
Ação: Movimentar (na linha da produção)

Nova Etapa: costura
Local de Destino: Estância Velha
Observações: Enviado 2000 pares para costura - Transportado em 09/12/2025

[Movimentar]
```

**Estado Atual**:
```
Produto: Luva Vaqueta
Quantidade: 2000 pares
Etapa: costura
Local: Estância Velha
Status: em_processo
Estoque Vaqueta AB: NÃO baixado ainda ⚠️
```

**Histórico registrado**:
- 09/12/2025 10:30 - corte → costura
- Campo Bom → Estância Velha
- 2000 pares

#### Dia 7 - Retornar para Revisão em Campo Bom
```
Ação: Movimentar

Nova Etapa: revisao
Local de Destino: Campo Bom
Observações: Costura finalizada, retorno para revisão

[Movimentar]
```

**Estado Atual**:
```
Produto: Luva Vaqueta
Quantidade: 2000 pares
Etapa: revisao
Local: Campo Bom
Status: em_processo
Estoque Vaqueta AB: NÃO baixado ainda ⚠️
```

#### Dia 10 - Finalizar Produção
```
Ação: Finalizar

[Confirmar Finalização]
```

**Resultado Final**:
```
✅ Status: finalizado
✅ 2000 pares → Estoque de Produtos (Luva Vaqueta)
✅ 20m² → Baixa do Estoque de Insumos (Vaqueta AB)
✅ Histórico completo registrado
```

**Histórico Completo**:
```
09/12/2025 08:00 - Início → corte (Campo Bom)
09/12/2025 10:30 - corte → costura (Campo Bom → Estância Velha)
11/12/2025 14:00 - costura → revisao (Estância Velha → Campo Bom)
13/12/2025 09:00 - revisao → finalizado (Produção concluída)
```

---

## Cenário 3: Enviar para Atelier Terceiro

### Situação
500 pares para costura em atelier externo.

### Passos

#### 1. Iniciar Produção
```
Produto: Luva Mista
Quantidade: 500
Etapa Inicial: corte
Local: Campo Bom
[Iniciar Produção]
```

#### 2. Enviar para Atelier
```
Ação: Movimentar

Nova Etapa: costura
Local de Destino: Atelier Externo 1
Observações: Enviado para Maria - Prazo: 5 dias

[Movimentar]
```

**Estado Atual**:
```
Etapa: costura
Local: Atelier Externo 1 (Terceiro)
Status: em_processo
```

#### 3. Retornar do Atelier
```
Ação: Movimentar

Nova Etapa: revisao
Local de Destino: Campo Bom
Observações: Retorno do atelier

[Movimentar]
```

#### 4. Finalizar
```
Ação: Finalizar
```

---

## Cenário 4: Produção Paralela em Múltiplos Locais

### Situação
3 lotes diferentes, 3 locais diferentes.

### Lote 1
```
Produto: Luva Vaqueta
Quantidade: 1000
Local: Campo Bom
Etapa: corte
```

### Lote 2
```
Produto: Luva Raspa
Quantidade: 1500
Local: Estância Velha
Etapa: costura
```

### Lote 3
```
Produto: Luva Mista
Quantidade: 800
Local: Atelier Externo 1
Etapa: costura
```

**Visualização no Dashboard**:
```
┌─────────────────────────────────────────────────┐
│ PRODUÇÃO ATIVA                                  │
├──────────────┬───────┬────────┬────────────────┤
│ Produto      │ Qtd   │ Etapa  │ Local          │
├──────────────┼───────┼────────┼────────────────┤
│ L. Vaqueta   │ 1000  │ corte  │ Campo Bom      │
│ L. Raspa     │ 1500  │ costura│ Est. Velha     │
│ L. Mista     │ 800   │ costura│ Atelier Ext 1  │
└──────────────┴───────┴────────┴────────────────┘
```

---

## Cenário 5: Controle de WIP (Work in Progress)

### Consultar Total em Produção

#### Via Interface
- Acesse **Rastreamento Produção**
- Veja os cards no topo:
  - **Em Processo**: 15 produções
  - **Em Trânsito**: 3 produções
  - **Finalizados**: 127 produções

#### Via SQL
```sql
SELECT 
  etapa,
  COUNT(*) as lotes,
  SUM(quantidade) as total_pares
FROM producao_rastreamento
WHERE status != 'finalizado'
GROUP BY etapa;
```

**Resultado**:
```
┌──────────┬───────┬─────────────┐
│ etapa    │ lotes │ total_pares │
├──────────┼───────┼─────────────┤
│ corte    │   5   │   4,500     │
│ costura  │   8   │   6,200     │
│ revisao  │   2   │   1,800     │
└──────────┴───────┴─────────────┘

Total WIP: 12,500 pares
```

---

## Cenário 6: Relatório de Produtividade

### Tempo Médio de Produção por Produto

```sql
SELECT 
  p.nome as produto,
  ROUND(AVG(EXTRACT(EPOCH FROM (pr.data_finalizacao - pr.data_inicio)) / 86400), 2) as media_dias
FROM producao_rastreamento pr
JOIN produtos p ON pr.produto_id = p.id
WHERE pr.status = 'finalizado'
GROUP BY p.nome
ORDER BY media_dias;
```

**Resultado**:
```
┌──────────────┬────────────┐
│ produto      │ media_dias │
├──────────────┼────────────┤
│ Luva Raspa   │    3.5     │
│ Luva Vaqueta │    4.2     │
│ Luva Mista   │    5.1     │
└──────────────┴────────────┘
```

**Insight**: Luva Raspa é produzida mais rápido (3.5 dias em média)

---

## Cenário 7: Rastrear Insumo Específico

### Pergunta: "Quantos pares foram produzidos com Vaqueta AB?"

```sql
SELECT 
  i.nome as insumo,
  COUNT(pr.id) as total_lotes,
  SUM(pr.quantidade) as total_pares
FROM producao_rastreamento pr
JOIN insumos i ON pr.insumo_origem_id = i.id
WHERE i.nome = 'Vaqueta AB'
  AND pr.status = 'finalizado'
GROUP BY i.nome;
```

**Resultado**:
```
Insumo: Vaqueta AB
Total de lotes: 23
Total produzido: 18,500 pares
```

---

## Cenário 8: Alertas de Produção Parada

### Produções há mais de 7 dias na mesma etapa

```sql
SELECT 
  p.nome,
  pr.quantidade,
  pr.etapa,
  l.nome as local,
  EXTRACT(DAY FROM (NOW() - pr.data_inicio)) as dias_parado
FROM producao_rastreamento pr
JOIN produtos p ON pr.produto_id = p.id
JOIN locais_producao l ON pr.local_atual_id = l.id
WHERE pr.status != 'finalizado'
  AND pr.data_inicio < NOW() - INTERVAL '7 days'
ORDER BY dias_parado DESC;
```

**Resultado - Alerta**:
```
⚠️ PRODUÇÕES PARADAS

Luva Vaqueta - 1000 pares
Etapa: costura
Local: Atelier Externo 1
Parado há: 12 dias
→ Ação necessária!
```

---

## Dicas de Uso

### ✅ Boas Práticas

1. **Sempre preencher Observações**
   - Registre informações importantes
   - Ex: "Enviado em caminhão X", "Retorno agendado para DD/MM"

2. **Vincular Insumo de Origem**
   - Facilita rastreabilidade
   - Importante para controle de qualidade

3. **Movimentar conforme avanço real**
   - Não deixe produções "esquecidas" no sistema

4. **Finalizar assim que pronto**
   - Libera estoque correto
   - Atualiza métricas

### ❌ Evitar

1. Criar produção e nunca finalizar
2. Pular etapas sem registrar
3. Não preencher observações importantes
4. Movimentar sem confirmar fisicamente

---

## Integração com Outros Módulos

### Com Estoque de Insumos
- **Ao iniciar**: Vincular insumo de origem
- **Ao finalizar**: Baixa automática do insumo

### Com Estoque de Produtos
- **Ao finalizar**: Entrada automática no estoque
- **Registro**: Movimentação de entrada registrada

### Com Pedidos (futuro)
- Vincular produção a pedido específico
- Rastrear: Pedido → Produção → Entrega

---

**Sistema Luvas Dois Irmãos**  
Exemplos Práticos - Rastreamento de Produção v1.0
