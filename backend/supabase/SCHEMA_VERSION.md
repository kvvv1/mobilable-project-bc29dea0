# 📊 Controle de Versão do Schema - DriverFlow

Este documento rastreia todas as versões do schema do banco de dados e como aplicar migrations.

## 🎯 Versão Atual

**Versão:** `1.0.0`  
**Data:** 2024-01-XX  
**Status:** ✅ Completo e testado

## 📋 Como Aplicar o Schema

### Primeira Instalação (Versão 1.0.0)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo: `versions/001_initial_schema.sql`
4. Verifique se não houve erros

### Verificar Versão Atual

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

## 🔄 Sistema de Migrations

### Estrutura de Arquivos

```
backend/supabase/
├── schema.sql                    # Schema completo (atualizado)
├── SCHEMA_VERSION.md            # Este arquivo
├── MIGRATION_GUIDE.md           # Guia de migrations
└── versions/
    ├── 001_initial_schema.sql   # Versão 1.0.0
    ├── 002_xxxxx.sql            # Próxima versão
    └── ...
```

### Convenções de Nomenclatura

- `001_initial_schema.sql` - Versão 1.0.0
- `002_nome_da_migration.sql` - Versão 1.1.0
- `003_nome_da_migration.sql` - Versão 1.2.0
- etc.

## 📝 Histórico de Versões

### Versão 1.0.0 (2024-01-XX) - Schema Inicial

**Arquivo:** `versions/001_initial_schema.sql`

**Inclui:**
- ✅ Extensões (uuid-ossp, pgcrypto)
- ✅ Tabelas de autenticação e tenant
- ✅ Tabelas de usuários e perfis
- ✅ Tabelas de veículos
- ✅ Tabelas de corridas
- ✅ Tabelas de despesas
- ✅ Tabelas de templates
- ✅ Tabelas de configurações
- ✅ Tabelas de metas
- ✅ Tabelas de Stripe (pagamentos)
- ✅ Funções e triggers
- ✅ Row Level Security (RLS)
- ✅ Views úteis
- ✅ Índices de performance
- ✅ Tabela de controle de versões

**Status:** ✅ Completo e pronto para produção

## 🚀 Aplicar Nova Migration

Quando uma nova migration for criada:

1. **Verificar versão atual:**
   ```sql
   SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;
   ```

2. **Aplicar migration:**
   - Execute o arquivo SQL da nova versão no Supabase SQL Editor
   - A migration registrará automaticamente sua aplicação

3. **Verificar aplicação:**
   ```sql
   SELECT * FROM schema_migrations ORDER BY applied_at DESC;
   ```

## 📤 Como Receber Migrations Futuras

Quando precisar de alterações no schema:

1. **Informe a versão atual:**
   - Execute: `SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;`
   - Me informe a versão atual

2. **Receberá apenas o necessário:**
   - Um novo arquivo de migration (ex: `002_nome_da_migration.sql`)
   - Apenas as alterações necessárias
   - Instruções de aplicação

3. **Aplicar migration:**
   - Execute apenas o novo arquivo no Supabase
   - Não precisa executar o schema completo novamente

**Exemplo:**
- Versão atual: `1.0.0`
- Você precisa: Adicionar campo `notas` em `corridas`
- Você receberá: `002_add_notas_to_corridas.sql` com apenas:
  ```sql
  ALTER TABLE corridas ADD COLUMN IF NOT EXISTS notas TEXT;
  INSERT INTO schema_migrations (version, description) VALUES ('1.1.0', '...');
  ```

## ⚠️ Importante

- **Sempre faça backup** antes de aplicar migrations em produção
- **Teste em ambiente de desenvolvimento** primeiro
- **Leia as instruções** de cada migration antes de aplicar
- **Não pule versões** - aplique em ordem sequencial

## 📞 Suporte

Se encontrar problemas ao aplicar migrations:
1. Verifique os logs do Supabase
2. Consulte o arquivo da migration para detalhes
3. Revise este documento para instruções atualizadas

