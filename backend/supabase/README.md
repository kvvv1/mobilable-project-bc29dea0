# 🗄️ Schema do Banco de Dados - DriverFlow

Sistema de versionamento completo do schema do banco de dados PostgreSQL no Supabase.

## 📁 Estrutura

```
backend/supabase/
├── README.md                    # Este arquivo
├── schema.sql                   # Schema consolidado (referência)
├── SCHEMA_VERSION.md            # Controle de versões
├── MIGRATION_GUIDE.md          # Guia de migrations
└── versions/
    ├── 001_initial_schema.sql   # Versão 1.0.0 - Schema inicial
    └── ...                      # Futuras migrations
```

## 🚀 Primeira Instalação

### Passo 1: Acessar Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**

### Passo 2: Executar Schema Inicial

1. Abra o arquivo `versions/001_initial_schema.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar Instalação

Execute para verificar se tudo foi criado:

```sql
-- Verificar versão aplicada
SELECT * FROM schema_migrations ORDER BY applied_at DESC;

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

## ✅ Verificação do Schema

O schema está **completo e pronto para execução**. Inclui:

- ✅ **15 tabelas** principais
- ✅ **Extensões** necessárias (uuid-ossp, pgcrypto)
- ✅ **Índices** para performance
- ✅ **Row Level Security (RLS)** completo
- ✅ **Triggers** automáticos
- ✅ **Funções** auxiliares
- ✅ **Views** para estatísticas
- ✅ **Sistema de versionamento** integrado

## 🔄 Sistema de Versionamento

### Versão Atual

**Versão:** `1.0.0`  
**Arquivo:** `versions/001_initial_schema.sql`  
**Status:** ✅ Completo e testado

### Como Funciona

1. Cada migration tem um número sequencial (001, 002, 003...)
2. Cada migration registra sua versão na tabela `schema_migrations`
3. Migrations são aplicadas em ordem sequencial
4. Não é possível pular versões

### Verificar Versão Atual

```sql
SELECT version, description, applied_at 
FROM schema_migrations 
ORDER BY applied_at DESC 
LIMIT 1;
```

## 📝 Aplicar Nova Migration

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

## 🔧 Correções Aplicadas na Versão 1.0.0

O schema foi otimizado com:

- ✅ `IF NOT EXISTS` em todas as criações
- ✅ `DROP IF EXISTS` antes de recriar triggers/policies
- ✅ `ON CONFLICT` em inserções críticas
- ✅ Tratamento seguro de ENUMs
- ✅ Proteção contra execuções duplicadas

## 📊 Tabelas Criadas

### Autenticação e Tenant
- `organizations` - Organizações (tenants)
- `organization_members` - Membros das organizações
- `user_profiles` - Perfis de usuários

### Dados Principais
- `vehicles` - Veículos cadastrados
- `corridas` - Corridas registradas
- `despesas` - Despesas registradas
- `despesa_templates` - Templates de despesas
- `organization_settings` - Configurações
- `metas` - Metas e objetivos

### Pagamentos
- `subscription_plans` - Planos de assinatura
- `subscription_history` - Histórico de assinaturas
- `stripe_events` - Eventos do Stripe

### Controle
- `schema_migrations` - Controle de versões

## 🔒 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas RLS** configuradas para isolamento multi-tenant
- **Triggers** para atualização automática de timestamps
- **Funções** com `SECURITY DEFINER` quando necessário

## 📚 Documentação

- **SCHEMA_VERSION.md** - Histórico de versões
- **MIGRATION_GUIDE.md** - Como criar novas migrations
- **Este README** - Visão geral e instruções

## ⚠️ Importante

- **Sempre faça backup** antes de aplicar migrations em produção
- **Teste em desenvolvimento** primeiro
- **Não pule versões** - aplique em ordem sequencial
- **Leia as instruções** de cada migration antes de aplicar

## 🐛 Troubleshooting

### Erro: "relation already exists"
- O schema já foi aplicado anteriormente
- Verifique a versão atual: `SELECT * FROM schema_migrations;`
- Se necessário, use `DROP TABLE` antes de recriar

### Erro: "permission denied"
- Verifique se está usando a conta correta no Supabase
- Algumas operações requerem privilégios de superuser

### Erro: "type already exists"
- O ENUM já foi criado
- O schema usa `DO $$ BEGIN ... EXCEPTION ... END $$` para tratar isso

## 📞 Suporte

Para problemas ou dúvidas:
1. Consulte `SCHEMA_VERSION.md` para versões
2. Consulte `MIGRATION_GUIDE.md` para migrations
3. Verifique os logs do Supabase
4. Revise este README

---

**Última atualização:** 2024-01-XX  
**Versão atual:** 1.0.0  
**Status:** ✅ Pronto para produção


