# ⚡ Quick Start - Aplicar Schema no Supabase

Guia rápido para aplicar o schema pela primeira vez.

## 🎯 Passo a Passo

### 1. Acessar Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2. Executar Schema Inicial

1. Abra o arquivo: `backend/supabase/versions/001_initial_schema.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

⏱️ **Tempo estimado:** 10-30 segundos

### 3. Verificar Instalação

Execute este comando no SQL Editor:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;
```

**Resultado esperado:**
```
version  | description                          | applied_at
---------|--------------------------------------|-------------------
1.0.0    | Schema inicial completo do DriverFlow| 2024-01-XX ...
```

### 4. (Opcional) Verificação Completa

Execute o arquivo `verify_schema.sql` para verificação detalhada:

1. Abra `backend/supabase/verify_schema.sql`
2. Copie e cole no SQL Editor
3. Execute

## ✅ Pronto!

Se tudo estiver correto, você verá:
- ✅ Versão 1.0.0 registrada
- ✅ Todas as tabelas criadas
- ✅ Políticas RLS ativas
- ✅ Triggers funcionando

## 🐛 Problemas Comuns

### "relation already exists"
**Solução:** O schema já foi aplicado. Verifique a versão:
```sql
SELECT * FROM schema_migrations;
```

### "permission denied"
**Solução:** Use uma conta com privilégios de administrador no Supabase.

### "type already exists"
**Solução:** O ENUM já existe. O schema trata isso automaticamente, mas se persistir, execute:
```sql
DROP TYPE IF EXISTS despesa_tipo CASCADE;
```
Depois execute o schema novamente.

## 📚 Próximos Passos

Após aplicar o schema:

1. ✅ Configure autenticação (veja `mobile-app/AUTH_SETUP.md`)
2. ✅ Configure Stripe (veja `backend/STRIPE_SETUP.md`)
3. ✅ Configure variáveis de ambiente
4. ✅ Teste o sistema

## 🔄 Futuras Atualizações

Quando houver uma nova migration:

1. Verifique a versão atual
2. Execute apenas o arquivo da nova versão (ex: `002_xxxxx.sql`)
3. Verifique se foi aplicada corretamente

**Não execute o schema completo novamente!** Use apenas as migrations incrementais.

---

**Dúvidas?** Consulte `README.md` ou `SCHEMA_VERSION.md`


