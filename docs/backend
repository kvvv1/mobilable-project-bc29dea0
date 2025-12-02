# Documentação da API - DriverFlow Backend

## Base URL

```
Development: http://localhost:3000
Production: https://api.driverflow.com
```

## Autenticação

Todas as rotas protegidas requerem autenticação via JWT do Supabase:

```
Authorization: Bearer <token>
```

O token é obtido através do Supabase Auth no frontend.

---

## Endpoints

### Autenticação

#### GET /api/auth/me

Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "João Silva",
      "current_organization_id": "uuid"
    },
    "organizations": [
      {
        "id": "uuid",
        "name": "Minha Organização",
        "role": "owner"
      }
    ]
  }
}
```

#### POST /api/auth/switch-organization

Troca a organização ativa do usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "organizationId": "uuid"
}
```

**Response 200:**
```json
{
  "message": "Organização trocada com sucesso",
  "organizationId": "uuid"
}
```

---

### Organizações

#### GET /api/organizations

Lista todas as organizações do usuário.

**Response 200:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Minha Organização",
      "slug": "org-abc123",
      "subscription_status": "active",
      "subscription_plan": "pro",
      "role": "owner"
    }
  ]
}
```

#### GET /api/organizations/:id

Busca detalhes de uma organização específica.

**Response 200:**
```json
{
  "organization": {
    "id": "uuid",
    "name": "Minha Organização",
    "settings": {
      "rs_por_km_minimo": 1.80,
      "rs_por_hora_minimo": 25.00
    },
    "role": "owner"
  }
}
```

#### POST /api/organizations

Cria uma nova organização.

**Body:**
```json
{
  "name": "Nova Organização"
}
```

**Response 201:**
```json
{
  "message": "Organização criada com sucesso",
  "organization": {
    "id": "uuid",
    "name": "Nova Organização"
  }
}
```

---

### Corridas

#### GET /api/corridas

Lista corridas com paginação e filtros.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `start_date` (ISO string, optional)
- `end_date` (ISO string, optional)
- `plataforma` (string, optional)
- `user_id` (uuid, optional)

**Response 200:**
```json
{
  "corridas": [
    {
      "id": "uuid",
      "plataforma": "uber",
      "valor": 25.50,
      "distancia": 5.2,
      "tempo_estimado": 15,
      "lucro_liquido": 18.30,
      "margem_lucro": 71.76,
      "viabilidade": "excelente",
      "data_corrida": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### GET /api/corridas/stats

Retorna estatísticas de corridas.

**Query Parameters:**
- `start_date` (ISO string, optional)
- `end_date` (ISO string, optional)

**Response 200:**
```json
{
  "stats": {
    "total_corridas": 150,
    "total_receitas": 3825.50,
    "total_lucro": 2745.30,
    "total_km": 780.5,
    "valor_medio": 25.50,
    "margem_media": 71.76
  }
}
```

#### POST /api/corridas

Cria uma nova corrida.

**Body:**
```json
{
  "plataforma": "uber",
  "valor": 25.50,
  "distancia": 5.2,
  "tempo_estimado": 15,
  "origem": "Rua A, 123",
  "destino": "Rua B, 456",
  "vehicle_id": "uuid",
  "imagem_url": "https://...",
  "data_corrida": "2024-01-15T10:30:00Z"
}
```

**Response 201:**
```json
{
  "message": "Corrida criada com sucesso",
  "corrida": {
    "id": "uuid",
    "plataforma": "uber",
    "valor": 25.50,
    "lucro_liquido": 18.30,
    "viabilidade": "excelente"
  }
}
```

---

### Despesas

#### GET /api/despesas

Lista despesas com paginação e filtros.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `tipo` (string, optional)
- `start_date` (ISO string, optional)
- `end_date` (ISO string, optional)

**Response 200:**
```json
{
  "despesas": [
    {
      "id": "uuid",
      "tipo": "combustivel",
      "valor": 150.00,
      "descricao": "Abastecimento completo",
      "data_despesa": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "totalPages": 1
  }
}
```

#### POST /api/despesas

Cria uma nova despesa.

**Body:**
```json
{
  "tipo": "combustivel",
  "valor": 150.00,
  "descricao": "Abastecimento completo",
  "vehicle_id": "uuid",
  "data_despesa": "2024-01-15T08:00:00Z"
}
```

**Tipos de despesa:**
- `combustivel`
- `manutencao`
- `alimentacao`
- `estacionamento`
- `lavagem`
- `seguro`
- `licenciamento`
- `multa`
- `outros`

---

### Veículos

#### GET /api/vehicles

Lista veículos da organização.

**Response 200:**
```json
{
  "vehicles": [
    {
      "id": "uuid",
      "tipo": "moto",
      "marca": "Honda",
      "modelo": "CG 160",
      "ano": "2020",
      "consumo_medio": 38.5
    }
  ]
}
```

#### POST /api/vehicles

Cria um novo veículo.

**Body:**
```json
{
  "tipo": "moto",
  "marca": "Honda",
  "modelo": "CG 160",
  "ano": "2020",
  "consumo_medio": 38.5,
  "personalizado": false
}
```

---

### Configurações

#### GET /api/settings

Busca configurações da organização.

**Response 200:**
```json
{
  "settings": {
    "rs_por_km_minimo": 1.80,
    "rs_por_hora_minimo": 25.00,
    "distancia_maxima": 10.00,
    "tempo_maximo_estimado": 30,
    "media_km_por_litro": 12.00,
    "preco_combustivel": 6.00,
    "perfil_trabalho": "misto"
  }
}
```

#### PUT /api/settings

Atualiza configurações (apenas admin/owner).

**Body:**
```json
{
  "rs_por_km_minimo": 2.00,
  "preco_combustivel": 6.50
}
```

---

### Stripe (Pagamentos)

#### GET /api/stripe/plans

Lista planos disponíveis.

**Response 200:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Basic",
      "description": "Plano básico",
      "price_monthly": 29.90,
      "price_yearly": 299.00,
      "features": ["Corridas ilimitadas", "3 veículos"],
      "max_users": 3,
      "max_vehicles": 3
    }
  ]
}
```

#### POST /api/stripe/create-checkout-session

Cria sessão de checkout do Stripe.

**Body:**
```json
{
  "priceId": "price_xxxxx",
  "successUrl": "https://app.driverflow.com/success",
  "cancelUrl": "https://app.driverflow.com/cancel"
}
```

**Response 200:**
```json
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST /api/stripe/create-portal-session

Cria sessão do Customer Portal.

**Body:**
```json
{
  "returnUrl": "https://app.driverflow.com/settings"
}
```

**Response 200:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

#### GET /api/stripe/subscription

Retorna informações da assinatura atual.

**Response 200:**
```json
{
  "organization": {
    "subscription_status": "active",
    "subscription_plan": "pro",
    "trial_ends_at": null
  },
  "subscription": {
    "id": "sub_xxxxx",
    "status": "active",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "cancel_at_period_end": false
  }
}
```

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Acesso negado
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "error": {
    "message": "Mensagem de erro descritiva",
    "code": "ERROR_CODE",
    "stack": "..." // Apenas em desenvolvimento
  }
}
```

## Rate Limiting

- **Limite padrão**: 100 requisições por 15 minutos por IP
- **Limite estrito**: 10 requisições por 15 minutos para rotas sensíveis
- **Header de resposta**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Paginação

Todas as listagens suportam paginação:

- `page`: Número da página (começa em 1)
- `limit`: Itens por página (padrão: 50, máximo: 100)

Resposta inclui:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```




