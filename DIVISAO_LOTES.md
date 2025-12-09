# 📦 Divisão de Lotes - Movimentação Parcial

## Funcionalidade

Agora você pode **movimentar apenas parte da quantidade** de um lote de produção, permitindo flexibilidade total no gerenciamento.

## Como Funciona

### Cenário: 5500 pares cortados em Campo Bom

**Situação Inicial:**
```
Lote #1
- Produto: Luva Vaqueta
- Quantidade: 5500 pares
- Etapa: corte
- Local: Campo Bom
```

### Movimentar Apenas 2000 Pares

1. **Abrir Movimentação**
   - Clique em **Movimentar** no lote
   - O campo "Quantidade a Movimentar" vem preenchido com `5500` (total)

2. **Alterar Quantidade**
   - Digite `2000` no campo "Quantidade a Movimentar"
   - Aparece aviso: "⚠️ Lote será dividido: 2000 serão movimentados, 3500 permanecerão no local atual"

3. **Preencher Destino**
   - Nova Etapa: `costura`
   - Local de Destino: `Estância Velha`
   - Observações: "Primeiro lote para costura"

4. **Confirmar Movimentação**

**Resultado:**
```
Lote #1 (Original - ATUALIZADO)
- Produto: Luva Vaqueta
- Quantidade: 3500 pares ← Reduzido
- Etapa: corte
- Local: Campo Bom

Lote #2 (NOVO - Criado automaticamente)
- Produto: Luva Vaqueta
- Quantidade: 2000 pares
- Etapa: costura
- Local: Estância Velha
- Observações: "Dividido do lote original - Primeiro lote para costura"
```

## Exemplos Práticos

### Exemplo 1: Dividir em 3 Partes

**Inicial:** 6000 pares em Campo Bom (corte)

**Movimentação 1:**
- Mover 2000 para Estância Velha (costura)
- **Resultado:** 4000 em Campo Bom, 2000 em Estância Velha

**Movimentação 2:**
- Mover 2000 do restante para Atelier Externo 1 (costura)
- **Resultado:** 2000 em Campo Bom, 2000 em Estância Velha, 2000 em Atelier Externo 1

**Estado Final:**
```
3 lotes independentes:
- 2000 pares → Campo Bom (corte)
- 2000 pares → Estância Velha (costura)
- 2000 pares → Atelier Externo 1 (costura)
```

### Exemplo 2: Movimentar Tudo

**Inicial:** 1000 pares

**Movimentação:**
- Quantidade: `1000` (total)
- Destino: Estância Velha

**Resultado:**
- **NÃO divide** o lote
- Apenas move todo o lote para o novo local
- Lote original continua o mesmo, só muda de etapa/local

## Interface do Usuário

### Campo "Quantidade a Movimentar"

```
┌─────────────────────────────────────────┐
│ Quantidade a Movimentar                 │
│ ┌─────────────────────────────────────┐ │
│ │ 2000                                │ │
│ └─────────────────────────────────────┘ │
│ Total disponível: 5500 pares            │
│                                         │
│ ⚠️ Lote será dividido:                  │
│ 2000 serão movimentados,                │
│ 3500 permanecerão no local atual        │
└─────────────────────────────────────────┘
```

### Validações

✅ **Quantidade > 0**  
✅ **Quantidade ≤ Total disponível**  
✅ **Apenas números inteiros**

❌ Erro se quantidade = 0  
❌ Erro se quantidade > total

## Histórico Registrado

### Quando Divide Lote

**Lote Original:**
```
Histórico:
- "Lote dividido: 2000 pares movimentados para costura"
- Quantidade após divisão: 3500 pares
```

**Lote Novo:**
```
Histórico:
- "Lote criado por divisão - Primeiro lote para costura"
- Etapa: corte → costura
- Local: Campo Bom → Estância Velha
- Quantidade: 2000 pares
```

### Quando Move Tudo

**Lote:**
```
Histórico:
- Etapa: corte → costura
- Local: Campo Bom → Estância Velha
- Quantidade: 5500 pares (total)
```

## Rastreabilidade

Cada lote dividido mantém:
- ✅ Mesmo produto
- ✅ Mesmo insumo de origem
- ✅ Histórico completo da divisão
- ✅ Vínculo com lote original via observações

## Vantagens

1. **Flexibilidade Total**
   - Envie quantidades específicas para diferentes locais
   - Mantenha parte do lote em uma etapa enquanto outra avança

2. **Rastreamento Preciso**
   - Cada sub-lote tem seu próprio rastreamento
   - Histórico completo de divisões

3. **Gerenciamento de Capacidade**
   - Distribua carga entre múltiplos atelieres
   - Controle fluxo de produção por etapa

4. **Auditoria Completa**
   - Sabe exatamente quantos pares foram para cada local
   - Registros detalhados de cada movimentação

## Casos de Uso

### 1. Distribuir Entre Atelieres
```
5500 pares cortados →
- 2000 para Atelier 1
- 2000 para Atelier 2
- 1500 permanecem em Campo Bom
```

### 2. Entregas Parciais
```
3000 pares prontos →
- 1000 enviados hoje (cliente A)
- 2000 aguardando transporte
```

### 3. Controle de Qualidade
```
4000 pares costurados →
- 3800 aprovados (para revisão)
- 200 com defeito (retornar para costura)
```

### 4. Gerenciamento de Estoque
```
10000 pares em estoque →
- 5000 para pedido urgente
- 5000 mantidos em estoque
```

## SQL - Como Funciona

### Movimentação Total (5500 → 5500)
```sql
-- Apenas UPDATE no lote existente
UPDATE producao_rastreamento
SET 
  etapa = 'costura',
  local_atual_id = 'estancia_velha_id',
  updated_at = NOW()
WHERE id = 'lote_id';
```

### Movimentação Parcial (5500 → 2000)
```sql
-- 1. Reduzir quantidade do lote original
UPDATE producao_rastreamento
SET quantidade = 3500
WHERE id = 'lote_original_id';

-- 2. Criar novo lote com quantidade movimentada
INSERT INTO producao_rastreamento (
  produto_id, quantidade, etapa, local_atual_id, ...
) VALUES (
  'produto_id', 2000, 'costura', 'estancia_velha_id', ...
);

-- 3 e 4. Registrar histórico de ambos os lotes
```

## Integração com Estoque

Quando **finalizar** lotes divididos:

```
Lote A: 3500 pares finalizados → +3500 no estoque
Lote B: 2000 pares finalizados → +2000 no estoque

Total no estoque: 5500 pares
```

Cada lote é finalizado independentemente!

## Dicas

✅ **Use observações claras**  
Exemplo: "Lote 1/3 para Atelier Maria"

✅ **Acompanhe pelo histórico**  
Veja todas as divisões realizadas

✅ **Finalize conforme fica pronto**  
Não precisa esperar todos os sub-lotes

❌ **Evite dividir demais**  
Muitos lotes pequenos dificultam gestão

---

**Sistema Luvas Dois Irmãos**  
Divisão de Lotes - Rastreamento de Produção v2.0
