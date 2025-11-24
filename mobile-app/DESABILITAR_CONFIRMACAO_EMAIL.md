# 🔧 Como Desabilitar Confirmação de Email no Supabase

## ⚠️ IMPORTANTE

Se você está recebendo o erro **"Email not confirmed"** ao fazer login, você precisa desabilitar a confirmação de email nas configurações do Supabase.

## 📋 Passo a Passo

### 1. Acesse o Dashboard do Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Desabilite a Confirmação de Email

1. No menu lateral, clique em **Authentication**
2. Clique em **Providers**
3. Encontre o provedor **Email**
4. Clique para expandir as configurações
5. **DESMARQUE** a opção **"Enable email confirmations"**
6. Clique em **Save**

### 3. Verificar Configuração

Após desabilitar, você deve ver:
- ✅ **Enable email confirmations**: OFF (desabilitado)

## 🎯 Resultado

Após desabilitar:
- ✅ Usuários podem fazer login imediatamente após criar conta
- ✅ Não será necessário confirmar email
- ✅ O erro "Email not confirmed" não aparecerá mais

## 📝 Nota

Esta configuração é recomendada para:
- Desenvolvimento e testes
- Aplicativos onde a confirmação de email não é necessária
- Protótipos e MVPs

Para produção, você pode:
- Manter desabilitado (mais simples)
- Ou habilitar e implementar fluxo de confirmação de email

## 🔄 Após Desabilitar

1. Teste criar uma nova conta
2. Faça login imediatamente após o cadastro
3. O fluxo deve funcionar: Cadastro → Onboarding → Tutorial → App

## ❓ Problemas?

Se ainda tiver problemas:
1. Verifique se salvou as configurações
2. Aguarde alguns segundos para as mudanças propagarem
3. Tente criar uma nova conta de teste
4. Limpe o cache do app se necessário


