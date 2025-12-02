# 🗄️ Banco de Dados - Supabase

Esta pasta contém todos os arquivos SQL e scripts relacionados ao banco de dados Supabase.

## 📁 Estrutura

```
supabase/
├── README.md (este arquivo)
├── schema.sql              # Schema completo consolidado
├── verify_schema.sql       # Script de verificação
└── versions/               # Migrações versionadas
    ├── 001_initial_schema.sql
    ├── 002_fix_rls_policies.sql
    ├── 003_fix_rls_recursion.sql
    ├── 004_fix_rls_recursion_final.sql
    └── 005_fix_rls_recursion_definitive.sql
```

## 📚 Documentação

A documentação relacionada ao Supabase foi movida para `docs/backend/supabase/`:
- `QUICK_START.md` - Início rápido
- `MIGRATION_GUIDE.md` - Guia de migração
- `SCHEMA_VERSION.md` - Versão do schema
- `APLICAR_CORRECAO_RLS.md` - Aplicar correção RLS

## 🚀 Como Usar

### Aplicar Schema Inicial
```sql
-- Execute no Supabase SQL Editor:
-- backend/supabase/versions/001_initial_schema.sql
```

### Aplicar Migrações
```sql
-- Execute as migrações em ordem:
-- 001_initial_schema.sql
-- 002_fix_rls_policies.sql
-- 003_fix_rls_recursion.sql
-- etc.
```

### Verificar Schema
```sql
-- Execute para verificar:
-- backend/supabase/verify_schema.sql
```

## 📋 Arquivos SQL

### schema.sql
Schema completo consolidado. **Não use diretamente** - use as migrações em `versions/`.

### verify_schema.sql
Script para verificar se o schema está correto.

### versions/
Migrações versionadas do banco de dados. Execute em ordem numérica.

## ⚠️ Importante

- **Nunca execute `schema.sql` diretamente** se já tiver dados
- **Use as migrações em `versions/`** para atualizar o banco
- **Sempre faça backup** antes de aplicar migrações em produção
- **Consulte `docs/backend/supabase/MIGRATION_GUIDE.md`** para mais detalhes
