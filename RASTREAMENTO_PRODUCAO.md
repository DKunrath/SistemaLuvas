# Sistema de Rastreamento de Produção

## Visão Geral

O sistema de rastreamento permite acompanhar produtos em diferentes **etapas de produção** e **locais**, sem remover do estoque até a finalização completa.

## Conceito

### Fluxo de Produção
1. **Corte** (Campo Bom) → 2000 pares cortados
2. **Costura** (Estância Velha) → Movimenta para costura
3. **Revisão** → Controle de qualidade
4. **Embalagem** → Preparação final
5. **Finalizado** → Entrada no estoque

### Locais de Produção
- **Campo Bom** (Unidade Própria - Corte)
- **Estância Velha** (Unidade Própria - Costura)
- **Atelieres Externos** (Terceirizados)

## Como Funciona

### 1. Iniciar Nova Produção
- Acesse **Rastreamento Produção**
- Clique em **Nova Produção**
- Preencha:
  - **Produto**: Luva Vaqueta, Luva Raspa, etc.
  - **Quantidade**: Ex: 2000 pares
  - **Etapa Inicial**: corte
  - **Local**: Campo Bom
  - **Insumo Origem** (opcional): Qual couro foi usado
  - **Observações**: Informações adicionais

**Resultado**: Produção criada com status "em_processo" na etapa de corte.

### 2. Movimentar Entre Etapas/Locais
**Exemplo: Enviar 2000 pares de Campo Bom (Corte) para Estância Velha (Costura)**

- Na tabela de **Produção Ativa**, clique em **Movimentar**
- Selecione:
  - **Nova Etapa**: costura
  - **Local de Destino**: Estância Velha
  - **Observações**: "Enviado para costura"
- Clique em **Movimentar**

**Resultado**: 
- Produto continua no rastreamento
- Etapa muda de "corte" para "costura"
- Local muda de "Campo Bom" para "Estância Velha"
- **NÃO remove do estoque de insumos**
- Histórico registra a movimentação

### 3. Finalizar Produção
Quando o produto estiver completamente pronto:

- Clique em **Finalizar**
- Confirme a finalização

**Resultado**:
- Status muda para "finalizado"
- **2000 pares são ADICIONADOS ao Estoque de Produtos**
- **Neste momento o insumo (couro) é baixado do estoque**
- Movimentação registrada no histórico

## Vantagens

✅ **Rastreabilidade Total**: Sabe onde cada lote está  
✅ **Controle por Local**: Acompanha produções em diferentes unidades  
✅ **Histórico Completo**: Todas as movimentações registradas  
✅ **Estoque Correto**: Só baixa quando realmente finalizado  
✅ **WIP Visível**: Vê produtos "Work in Progress"  

## Tabelas do Banco de Dados

### `producao_rastreamento`
Registra cada lote de produção:
- `produto_id`: Qual produto está sendo produzido
- `quantidade`: Quantos pares/unidades
- `etapa`: corte, costura, revisao, embalagem, finalizado
- `local_atual_id`: Onde está agora
- `status`: em_processo, em_transito, finalizado
- `insumo_origem_id`: Qual couro/insumo foi usado

### `producao_rastreamento_historico`
Histórico de todas as movimentações:
- `rastreamento_id`: Referência ao lote
- `etapa_anterior` → `etapa_nova`
- `local_anterior` → `local_novo`
- `quantidade`: Quantos foram movimentados
- `created_at`: Quando aconteceu

### `locais_producao`
Cadastro de locais:
- `nome`: Campo Bom, Estância Velha, etc.
- `tipo`: unidade_propria ou atelier_terceiro
- `ativo`: Se está ativo

## Integração com Estoque

### Antes (Sem Rastreamento)
```
Corte → Imediato baixa de couro
```

### Agora (Com Rastreamento)
```
1. Iniciar Produção (Corte)
   └─ NÃO baixa couro ainda
   
2. Movimentar para Costura
   └─ NÃO baixa couro ainda
   
3. Movimentar para Revisão
   └─ NÃO baixa couro ainda
   
4. Finalizar Produção
   └─ AGORA baixa couro
   └─ AGORA adiciona produto ao estoque
```

## SQL para Criar as Tabelas

Execute o script: `scripts/004-create-producao-rastreamento.sql`

```sql
-- Cria tabelas de rastreamento
-- Insere locais padrão
-- Cria índices para performance
```

## Dashboard

O sistema mostra:
- **Em Processo**: Produções ativas
- **Em Trânsito**: Em movimentação entre locais
- **Finalizados**: Concluídos e no estoque

## Exemplo Prático

### Cenário: 2000 pares de Luva Vaqueta

**Dia 1 - Corte**
```
Nova Produção:
- Produto: Luva Vaqueta
- Quantidade: 2000 pares
- Etapa: corte
- Local: Campo Bom
- Insumo: Vaqueta AB (20m²)
```

**Dia 3 - Enviar para Costura**
```
Movimentar:
- Nova Etapa: costura
- Local Destino: Estância Velha
- Obs: "Enviado 2000 pares para costura"
```
**Status**: Couro ainda NÃO foi baixado do estoque

**Dia 7 - Finalizar**
```
Finalizar Produção:
- 2000 pares → Estoque de Produtos
- 20m² Vaqueta AB → Baixa do Estoque de Insumos
```

## Relatórios Disponíveis

### Produção Ativa
Mostra todos os lotes em processo:
- Produto
- Quantidade
- Etapa atual
- Local atual
- Data de início

### Histórico
Todas as movimentações:
- Data/hora
- Movimentação (etapa anterior → nova)
- Local (origem → destino)
- Quantidade
- Observações

## Acesso

**Menu**: Dashboard → **Rastreamento Produção**  
**Ícone**: 📍 MapPin

---

**Desenvolvido para Luvas Dois Irmãos**  
Sistema de Gestão Integrada
