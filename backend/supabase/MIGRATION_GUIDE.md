# 🔄 Guia de Migrations - DriverFlow

Este guia explica como criar e aplicar novas migrations do schema.

## 📋 Processo de Migration

### 1. Quando Criar uma Migration?

Crie uma nova migration quando precisar:
- Adicionar novas tabelas
- Adicionar/modificar colunas
- Criar novos índices
- Modificar políticas RLS
- Adicionar novas funções/triggers
- Qualquer alteração no schema

### 2. Estrutura de uma Migration

```sql
-- ============================================
-- VERSÃO X.Y.Z - NOME DA MIGRATION
-- Data: YYYY-MM-DD
-- Descrição: O que esta migration faz
-- ============================================

-- Suas alterações aqui...

-- Registrar versão
INSERT INTO schema_migrations (version, description)
VALUES ('X.Y.Z', 'Descrição da migration')
ON CONFLICT (version) DO NOTHING;
```

### 3. Boas Práticas

#### ✅ Sempre Use IF NOT EXISTS / DROP IF EXISTS

```sql
-- ✅ BOM
CREATE TABLE IF NOT EXISTS nova_tabela (...);
DROP TABLE IF EXISTS tabela_antiga;

-- ❌ RUIM
CREATE TABLE nova_tabela (...);  -- Falha se já existir
```

#### ✅ Use Transações Quando Possível

```sql
BEGIN;

-- Suas alterações...

COMMIT;
```

#### ✅ Adicione ON CONFLICT para Inserções

```sql
INSERT INTO tabela (coluna) VALUES ('valor')
ON CONFLICT (coluna) DO NOTHING;
```

#### ✅ Documente Alterações Destrutivas

```sql
-- ⚠️ ATENÇÃO: Esta migration remove dados!
-- Faça backup antes de executar
DELETE FROM tabela WHERE condicao;
```

#### ✅ Teste em Desenvolvimento Primeiro

Sempre teste a migration em um ambiente de desenvolvimento antes de aplicar em produção.

## 📝 Exemplo de Migration

```sql
-- ============================================
-- VERSÃO 1.1.0 - Adicionar campo de notas em corridas
-- Data: 2024-02-15
-- Descrição: Adiciona campo opcional de notas/observações nas corridas
-- ============================================

-- Adicionar coluna
ALTER TABLE corridas 
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Adicionar índice se necessário
CREATE INDEX IF NOT EXISTS idx_corridas_notas 
ON corridas USING gin(to_tsvector('portuguese', notas))
WHERE notas IS NOT NULL;

-- Comentário na coluna
COMMENT ON COLUMN corridas.notas IS 'Observações e notas adicionais sobre a corrida';

-- Registrar versão
INSERT INTO schema_migrations (version, description)
VALUES ('1.1.0', 'Adicionar campo de notas em corridas')
ON CONFLICT (version) DO NOTHING;
```

## 🔍 Verificar Estado do Schema

### Ver versões aplicadas

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

### Verificar se uma tabela existe

```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'nome_tabela'
);
```

### Verificar se uma coluna existe

```sql
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nome_tabela'
    AND column_name = 'nome_coluna'
);
```

### Verificar políticas RLS

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🚨 Rollback (Desfazer Migration)

Se precisar desfazer uma migration:

1. **Crie um script de rollback:**
   ```sql
   -- rollback_001_initial_schema.sql
   -- Remover alterações da versão 1.0.0
   ```

2. **Execute o rollback:**
   ```sql
   -- Remover registro da versão
   DELETE FROM schema_migrations WHERE version = '1.0.0';
   
   -- Reverter alterações...
   ```

⚠️ **Atenção:** Rollbacks podem ser complexos. Sempre faça backup antes!

## 📦 Checklist Antes de Aplicar Migration

- [ ] Migration testada em desenvolvimento
- [ ] Backup do banco de dados feito
- [ ] Migration documentada
- [ ] Versão registrada corretamente
- [ ] Sem dependências quebradas
- [ ] Políticas RLS atualizadas (se necessário)
- [ ] Índices criados (se necessário)
- [ ] Views atualizadas (se necessário)

## 🔗 Recursos

- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)


