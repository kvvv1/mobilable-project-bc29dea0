# Guia de Configuração do Stripe

Este guia explica como configurar o Stripe para assinaturas e pagamentos no DriverFlow.

## 1. Criar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta (ou faça login)
3. Complete o onboarding
4. Ative o modo **Test Mode** para desenvolvimento

## 2. Criar Produtos e Preços

### 2.1. Criar Produto "Free Plan"

1. Vá em **Products** > **Add product**
2. Configure:
   - **Name**: Free Plan
   - **Description**: Plano gratuito com funcionalidades básicas
   - **Pricing model**: Standard pricing
   - **Price**: R$ 0,00
   - **Billing period**: Monthly
3. Clique em **Save product**
4. **Copie o Price ID** (ex: `price_xxxxx`)

### 2.2. Criar Produto "Basic Plan"

1. Vá em **Products** > **Add product**
2. Configure:
   - **Name**: Basic Plan
   - **Description**: Plano básico para uso individual
   - **Pricing model**: Standard pricing
   - **Price**: R$ 29,90
   - **Billing period**: Monthly
   - **Recurring**: Monthly
3. Clique em **Save product**
4. **Copie o Price ID**

### 2.3. Criar Produto "Pro Plan"

1. Vá em **Products** > **Add product**
2. Configure:
   - **Name**: Pro Plan
   - **Description**: Plano profissional com recursos avançados
   - **Price**: R$ 79,90
   - **Billing period**: Monthly
3. Clique em **Save product**
4. **Copie o Price ID**

### 2.4. Criar Versões Anuais (Opcional)

Para cada plano, você pode criar uma versão anual com desconto:

1. Edite o produto
2. Clique em **Add another price**
3. Configure:
   - **Price**: Valor anual (ex: R$ 299,00 para Basic)
   - **Billing period**: Yearly
4. **Copie o Price ID**

## 3. Inserir Planos no Banco de Dados

Execute no SQL Editor do Supabase:

```sql
-- Inserir planos (substitua os price_ids pelos seus)
INSERT INTO subscription_plans (
  stripe_price_id,
  name,
  description,
  price_monthly,
  price_yearly,
  features,
  max_users,
  max_vehicles,
  is_active
) VALUES
  (
    'price_xxxxx', -- Free Plan Price ID
    'Free',
    'Plano gratuito com funcionalidades básicas',
    0.00,
    0.00,
    '["Corridas ilimitadas", "1 veículo", "Suporte por email"]'::jsonb,
    1,
    1,
    true
  ),
  (
    'price_yyyyy', -- Basic Plan Monthly Price ID
    'Basic',
    'Plano básico para uso individual',
    29.90,
    299.00, -- Se tiver versão anual
    '["Corridas ilimitadas", "3 veículos", "Suporte por email", "Relatórios avançados"]'::jsonb,
    3,
    3,
    true
  ),
  (
    'price_zzzzz', -- Pro Plan Monthly Price ID
    'Pro',
    'Plano profissional com recursos avançados',
    79.90,
    799.00, -- Se tiver versão anual
    '["Corridas ilimitadas", "Veículos ilimitados", "Suporte prioritário", "Relatórios avançados", "API access"]'::jsonb,
    10,
    999,
    true
  );
```

## 4. Configurar Webhooks

### 4.1. Instalar Stripe CLI (Local Development)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Baixe de https://github.com/stripe/stripe-cli/releases

# Windows
# Baixe de https://github.com/stripe/stripe-cli/releases
```

### 4.2. Login no Stripe CLI

```bash
stripe login
```

### 4.3. Escutar Webhooks Localmente

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

O Stripe CLI mostrará um webhook secret (ex: `whsec_xxxxx`). Use este no `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4.4. Configurar Webhook no Dashboard (Produção)

1. Vá em **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Description**: DriverFlow Webhooks
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Clique em **Add endpoint**
5. **Copie o Signing secret** (ex: `whsec_xxxxx`)
6. Adicione no `.env` de produção

## 5. Obter API Keys

1. Vá em **Developers** > **API keys**
2. Copie:
   - **Publishable key**: `pk_test_xxxxx` (para frontend)
   - **Secret key**: `sk_test_xxxxx` (para backend - ⚠️ Mantenha secreto!)

## 6. Configurar Customer Portal

1. Vá em **Settings** > **Billing** > **Customer portal**
2. Configure:
   - **Business information**: Preencha seus dados
   - **Features**: Habilite o que desejar
   - **Branding**: Personalize conforme necessário
3. Salve as configurações

## 7. Testar Integração

### 7.1. Testar Checkout

1. Use um cartão de teste do Stripe:
   - **Sucesso**: `4242 4242 4242 4242`
   - **Falha**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
2. Data de expiração: Qualquer data futura
3. CVC: Qualquer 3 dígitos
4. CEP: Qualquer CEP válido

### 7.2. Testar Webhooks

```bash
# Enviar evento de teste
stripe trigger checkout.session.completed
```

Verifique se o evento foi processado no banco:

```sql
SELECT * FROM stripe_events 
WHERE event_type = 'checkout.session.completed' 
ORDER BY created_at DESC 
LIMIT 1;
```

## 8. Ativar Modo Produção

Quando estiver pronto para produção:

1. **Ative o modo Live** no Stripe Dashboard
2. **Crie produtos e preços no modo Live**
3. **Configure webhook de produção**
4. **Atualize as variáveis de ambiente**:
   ```env
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   ```

## 9. Monitoramento

### 9.1. Ver Eventos

1. Vá em **Developers** > **Events**
2. Veja todos os eventos recebidos
3. Filtre por tipo ou data

### 9.2. Ver Logs de Webhooks

1. Vá em **Developers** > **Webhooks**
2. Clique no seu endpoint
3. Veja os logs de tentativas e respostas

### 9.3. Ver Assinaturas

1. Vá em **Customers**
2. Veja todos os clientes e suas assinaturas
3. Monitore pagamentos e renovações

## 10. Troubleshooting

### Webhook não está sendo recebido
- Verifique se a URL está acessível publicamente
- Confirme que o webhook secret está correto
- Veja os logs no Stripe Dashboard

### Assinatura não está sendo atualizada
- Verifique os logs do webhook
- Confirme que o evento está sendo processado
- Veja a tabela `stripe_events` no banco

### Erro ao criar checkout session
- Verifique se o price_id existe no Stripe
- Confirme que a API key está correta
- Veja os logs do backend

## Recursos Adicionais

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)


