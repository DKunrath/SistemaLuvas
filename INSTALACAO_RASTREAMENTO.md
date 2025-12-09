# Guia de Instalação - Sistema de Rastreamento de Produção

## Passo 1: Executar o Script SQL

### Acesse o Supabase:
1. Entre em https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Execute o Script:
1. Clique em **New Query**
2. Copie todo o conteúdo do arquivo `scripts/004-create-producao-rastreamento.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou pressione `Ctrl + Enter`)

### Verifique a Criação:
No **Table Editor**, você deve ver as novas tabelas:
- ✅ `locais_producao`
- ✅ `producao_rastreamento`
- ✅ `producao_rastreamento_historico`

E os locais padrão já estarão inseridos:
- Campo Bom
- Estância Velha
- Atelier Externo 1
- Atelier Externo 2

## Passo 2: Verificar Permissões RLS

Se você usa Row Level Security (RLS), adicione as políticas:

```sql
-- Permitir acesso total às tabelas para usuários autenticados
-- (Ajuste conforme sua política de segurança)

-- Locais de Produção
ALTER TABLE locais_producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso a locais" ON locais_producao FOR ALL USING (true);

-- Rastreamento
ALTER TABLE producao_rastreamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso a rastreamento" ON producao_rastreamento FOR ALL USING (true);

-- Histórico
ALTER TABLE producao_rastreamento_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso a histórico" ON producao_rastreamento_historico FOR ALL USING (true);
```

## Passo 3: Testar a Aplicação

1. Execute o projeto:
```bash
npm run dev
```

2. Faça login no sistema

3. Acesse **Rastreamento Produção** no menu lateral

4. Teste criar uma nova produção

## Passo 4: Adicionar Mais Locais (Opcional)

Se precisar adicionar mais locais/atelieres:

```sql
INSERT INTO locais_producao (nome, tipo, observacoes) VALUES
  ('Atelier Maria', 'atelier_terceiro', 'Costureira terceirizada'),
  ('Atelier João', 'atelier_terceiro', 'Especializado em revisão');
```

## Estrutura de Dados

### Tipos de Etapas:
- `corte` - Corte do couro
- `costura` - Costura das luvas
- `revisao` - Controle de qualidade
- `embalagem` - Preparação final
- `finalizado` - Pronto para estoque

### Status:
- `em_processo` - Trabalhando na etapa
- `em_transito` - Movendo entre locais
- `finalizado` - Concluído

### Tipos de Local:
- `unidade_propria` - Unidades da empresa
- `atelier_terceiro` - Parceiros externos

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se executou o script SQL corretamente
- Confirme que as tabelas foram criadas no Table Editor

### Erro: "permission denied"
- Configure as políticas RLS (passo 2)
- Ou desabilite RLS temporariamente para testes

### Dados não aparecem
- Verifique a conexão com Supabase
- Cheque se as variáveis de ambiente estão corretas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Próximos Passos

Após instalação:
1. ✅ Cadastre seus locais de produção
2. ✅ Inicie uma produção de teste
3. ✅ Movimente entre etapas
4. ✅ Finalize e veja a entrada no estoque

## Suporte

Consulte: `RASTREAMENTO_PRODUCAO.md` para detalhes de uso.

---

**Sistema Luvas Dois Irmãos**  
v2.0 - Rastreamento de Produção
