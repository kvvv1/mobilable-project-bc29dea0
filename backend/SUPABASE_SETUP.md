# Guia de Configuração do Supabase

Este guia explica como configurar o Supabase para o DriverFlow Backend.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha:
   - **Name**: driverflow (ou seu nome preferido)
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America - São Paulo)
5. Aguarde a criação do projeto (~2 minutos)

## 2. Executar Schema SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `supabase/schema.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode levar alguns segundos)

## 3. Configurar Storage (Opcional - para imagens)

1. Vá em **Storage** no menu lateral
2. Clique em **Create a new bucket**
3. Configure:
   - **Name**: `corridas-images`
   - **Public bucket**: Desmarcado (privado)
   - **File size limit**: 5MB (ou conforme necessário)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
4. Clique em **Create bucket**

### Políticas de Storage

Após criar o bucket, configure as políticas RLS:

```sql
-- Permitir upload apenas para usuários autenticados de suas organizações
CREATE POLICY "Users can upload images to their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'corridas-images' AND
  auth.uid() IN (
    SELECT user_id FROM organization_members
    WHERE organization_id::text = (storage.foldername(name))[1]
  )
);

-- Permitir leitura apenas para membros da organização
CREATE POLICY "Users can view images from their organization"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'corridas-images' AND
  auth.uid() IN (
    SELECT user_id FROM organization_members
    WHERE organization_id::text = (storage.foldername(name))[1]
  )
);
```

## 4. Obter Credenciais

1. Vá em **Settings** > **API**
2. Copie as seguintes credenciais:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (⚠️ Mantenha secreto!)

## 5. Configurar Autenticação

### Habilitar Email/Password

1. Vá em **Authentication** > **Providers**
2. Certifique-se de que **Email** está habilitado
3. Configure conforme necessário:
   - **Enable email confirmations**: Opcional
   - **Enable email change confirmations**: Recomendado

### Configurar URLs de Redirecionamento

1. Vá em **Authentication** > **URL Configuration**
2. Adicione suas URLs:
   - **Site URL**: `http://localhost:19006` (desenvolvimento)
   - **Redirect URLs**: 
     - `http://localhost:19006/**`
     - `https://seu-dominio.com/**`

## 6. Configurar Row Level Security (RLS)

O schema SQL já configura as políticas RLS automaticamente. Verifique se estão ativas:

1. Vá em **Table Editor**
2. Selecione qualquer tabela (ex: `corridas`)
3. Vá na aba **Policies**
4. Verifique se existem políticas criadas

## 7. Testar Conexão

Use o SQL Editor para testar:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 8. Configurar Webhooks (Opcional)

Se quiser usar webhooks do Supabase para eventos:

1. Vá em **Database** > **Webhooks**
2. Crie um novo webhook
3. Configure:
   - **Name**: `user-created`
   - **Table**: `auth.users`
   - **Events**: `INSERT`
   - **HTTP Request**: URL do seu backend

## 9. Backup e Restore

### Fazer Backup

```bash
# Usando Supabase CLI
supabase db dump -f backup.sql
```

### Restaurar Backup

```bash
supabase db reset
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f backup.sql
```

## 10. Monitoramento

### Ver Logs

1. Vá em **Logs** > **Postgres Logs**
2. Filtre por tipo de log necessário

### Ver Métricas

1. Vá em **Settings** > **Usage**
2. Monitore:
   - Database size
   - API requests
   - Storage usage

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se executou o schema.sql completamente
- Confirme que está usando o schema `public`

### Erro: "permission denied"
- Verifique as políticas RLS
- Confirme que o usuário pertence à organização

### Erro: "connection refused"
- Verifique as credenciais (URL e keys)
- Confirme que o projeto está ativo no Supabase

## Próximos Passos

Após configurar o Supabase:

1. Configure as variáveis de ambiente no backend
2. Teste a conexão com o banco
3. Execute alguns endpoints da API
4. Configure o Stripe para pagamentos


