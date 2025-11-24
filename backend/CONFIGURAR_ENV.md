# ⚙️ Configurar Variáveis de Ambiente - Backend

## 📝 Criar Arquivo .env

Crie um arquivo `.env` na pasta `backend/` com o seguinte conteúdo:

```env
# Supabase Configuration
SUPABASE_URL=https://wlfmhygheizuuyohcbyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc0Mzc2MywiZXhwIjoyMDc5MzE5NzYzfQ.yiwV9CdygSo4Qxhiv6U1ojdMbvu71yMjw53JXoJ-Ihs
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDM3NjMsImV4cCI6MjA3OTMxOTc2M30.ojY2FqJq24HzPqf2DwiFDZUCCzA7LlUIDUCRtORZm00

# Stripe Configuration (Configure depois)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server Configuration
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:19006,http://localhost:3000

# JWT Secret
JWT_SECRET=your-jwt-secret-key-change-in-production

# Storage
STORAGE_BUCKET=corridas-images
```

## 🚀 Como Criar

### Windows (PowerShell)
```powershell
cd backend
@"
SUPABASE_URL=https://wlfmhygheizuuyohcbyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc0Mzc2MywiZXhwIjoyMDc5MzE5NzYzfQ.yiwV9CdygSo4Qxhiv6U1ojdMbvu71yMjw53JXoJ-Ihs
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDM3NjMsImV4cCI6MjA3OTMxOTc2M30.ojY2FqJq24HzPqf2DwiFDZUCCzA7LlUIDUCRtORZm00
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
```

### Linux/Mac
```bash
cd backend
cat > .env << 'EOF'
SUPABASE_URL=https://wlfmhygheizuuyohcbyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzc0Mzc2MywiZXhwIjoyMDc5MzE5NzYzfQ.yiwV9CdygSo4Qxhiv6U1ojdMbvu71yMjw53JXoJ-Ihs
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDM3NjMsImV4cCI6MjA3OTMxOTc2M30.ojY2FqJq24HzPqf2DwiFDZUCCzA7LlUIDUCRtORZm00
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
EOF
```

### Manualmente
1. Crie um arquivo chamado `.env` na pasta `backend/`
2. Cole o conteúdo acima
3. Salve o arquivo

## ✅ Verificar

Após criar o arquivo, teste a conexão:

```bash
cd backend
npm install
npm run dev
```

Se não houver erros, a conexão está funcionando!


