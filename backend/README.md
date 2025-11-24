# Corrida Certa Backend - Sistema Multi-Tenant com Supabase e Stripe

Backend completo para o aplicativo Corrida Certa, construído com arquitetura multi-tenant, integração com Supabase para banco de dados e Stripe para pagamentos.

## 🏗️ Arquitetura

- **Multi-Tenant**: Sistema isolado por organização (tenant)
- **Supabase**: Banco de dados PostgreSQL com Row Level Security (RLS)
- **Stripe**: Integração completa para assinaturas e pagamentos
- **Node.js + TypeScript**: Backend robusto e type-safe
- **Express**: Framework web rápido e flexível

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- Conta no Stripe (para pagamentos)
- PostgreSQL (gerenciado pelo Supabase)

## 🚀 Instalação

1. **Instalar dependências:**
```bash
cd backend
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_ANON_KEY=sua-anon-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
```

3. **Configurar banco de dados no Supabase:**
   - Acesse o Supabase Dashboard
   - Vá em SQL Editor
   - Execute o arquivo `supabase/schema.sql`

4. **Iniciar servidor:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **organizations**: Organizações (tenants)
- **organization_members**: Membros das organizações
- **user_profiles**: Perfis de usuários
- **vehicles**: Veículos cadastrados
- **corridas**: Corridas registradas
- **despesas**: Despesas registradas
- **despesa_templates**: Templates de despesas
- **organization_settings**: Configurações por organização
- **metas**: Metas e objetivos
- **subscription_plans**: Planos de assinatura
- **subscription_history**: Histórico de assinaturas
- **stripe_events**: Eventos do Stripe (webhooks)

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado, garantindo que:
- Usuários só acessam dados de suas organizações
- Permissões são verificadas automaticamente
- Dados são isolados por tenant

## 🔐 Autenticação

O sistema usa autenticação do Supabase (JWT). Todas as rotas protegidas requerem o header:

```
Authorization: Bearer <token>
```

O token é obtido através do Supabase Auth no frontend.

## 📡 API Endpoints

### Autenticação
- `GET /api/auth/me` - Informações do usuário autenticado
- `POST /api/auth/switch-organization` - Trocar organização ativa

### Organizações
- `GET /api/organizations` - Listar organizações do usuário
- `GET /api/organizations/:id` - Detalhes de uma organização
- `POST /api/organizations` - Criar nova organização
- `PUT /api/organizations/:id` - Atualizar organização

### Corridas
- `GET /api/corridas` - Listar corridas (com paginação e filtros)
- `GET /api/corridas/stats` - Estatísticas de corridas
- `GET /api/corridas/:id` - Detalhes de uma corrida
- `POST /api/corridas` - Criar nova corrida
- `PUT /api/corridas/:id` - Atualizar corrida
- `DELETE /api/corridas/:id` - Deletar corrida (soft delete)

### Despesas
- `GET /api/despesas` - Listar despesas
- `GET /api/despesas/stats` - Estatísticas de despesas
- `POST /api/despesas` - Criar nova despesa
- `PUT /api/despesas/:id` - Atualizar despesa
- `DELETE /api/despesas/:id` - Deletar despesa

### Veículos
- `GET /api/vehicles` - Listar veículos
- `POST /api/vehicles` - Criar veículo
- `PUT /api/vehicles/:id` - Atualizar veículo
- `DELETE /api/vehicles/:id` - Deletar veículo

### Configurações
- `GET /api/settings` - Buscar configurações
- `PUT /api/settings` - Atualizar configurações (apenas admin)

### Stripe (Pagamentos)
- `GET /api/stripe/plans` - Listar planos disponíveis
- `POST /api/stripe/create-checkout-session` - Criar sessão de checkout
- `POST /api/stripe/create-portal-session` - Criar sessão do Customer Portal
- `GET /api/stripe/subscription` - Informações da assinatura atual

### Webhooks
- `POST /api/webhooks/stripe` - Webhook do Stripe (não requer autenticação JWT)

## 💳 Integração com Stripe

### Configuração Inicial

1. **Criar produtos e preços no Stripe Dashboard:**
   - Free Plan (gratuito)
   - Basic Plan (mensal/anual)
   - Pro Plan (mensal/anual)
   - Enterprise Plan (mensal/anual)

2. **Inserir planos no banco:**
```sql
INSERT INTO subscription_plans (stripe_price_id, name, description, price_monthly, features, max_users, max_vehicles)
VALUES 
  ('price_xxx', 'Free', 'Plano gratuito', 0, '["Corridas ilimitadas", "1 veículo"]', 1, 1),
  ('price_yyy', 'Basic', 'Plano básico', 29.90, '["Corridas ilimitadas", "3 veículos", "Suporte por email"]', 3, 3),
  ('price_zzz', 'Pro', 'Plano profissional', 79.90, '["Corridas ilimitadas", "Veículos ilimitados", "Suporte prioritário"]', 10, 999);
```

3. **Configurar Webhook no Stripe:**
   - URL: `https://seu-dominio.com/api/webhooks/stripe`
   - Eventos a escutar:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### Fluxo de Assinatura

1. Usuário escolhe um plano
2. Frontend chama `POST /api/stripe/create-checkout-session`
3. Usuário é redirecionado para checkout do Stripe
4. Após pagamento, webhook atualiza status da organização
5. Usuário pode gerenciar assinatura via Customer Portal

## 🔒 Segurança

- **Row Level Security (RLS)**: Isolamento automático de dados por tenant
- **JWT Authentication**: Tokens seguros do Supabase
- **Rate Limiting**: Proteção contra abuso
- **Helmet**: Headers de segurança
- **CORS**: Configuração restritiva de origens

## 📝 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase | Sim |
| `SUPABASE_ANON_KEY` | Anon key do Supabase | Sim |
| `STRIPE_SECRET_KEY` | Secret key do Stripe | Sim |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret do Stripe | Sim |
| `PORT` | Porta do servidor | Não (padrão: 3000) |
| `NODE_ENV` | Ambiente (development/production) | Não |
| `API_BASE_URL` | URL base da API | Sim |
| `CORS_ORIGIN` | Origens permitidas (separadas por vírgula) | Sim |

## 🧪 Testes

```bash
npm test
```

## 📦 Deploy

### Vercel / Netlify / Railway

1. Configure as variáveis de ambiente
2. Deploy automático via Git

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Erro de autenticação
- Verifique se o token JWT está sendo enviado corretamente
- Confirme que o token não expirou
- Verifique as credenciais do Supabase

### Erro de RLS
- Verifique se o usuário pertence à organização
- Confirme que as políticas RLS estão corretas
- Verifique logs do Supabase

### Erro de webhook do Stripe
- Verifique se o webhook secret está correto
- Confirme que a URL do webhook está acessível
- Verifique logs do Stripe Dashboard

## 📚 Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Express Docs](https://expressjs.com/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT


