# 🔐 Guia de Configuração de Autenticação

Este guia explica como configurar o sistema de autenticação do DriverFlow.

## 📋 Pré-requisitos

1. Projeto Supabase criado (veja `backend/SUPABASE_SETUP.md`)
2. Schema do banco de dados executado
3. Variáveis de ambiente configuradas

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto `mobile-app/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

**Como obter as credenciais:**
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. Instalar Dependências

```bash
cd mobile-app
npm install
```

As dependências necessárias já estão no `package.json`:
- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`
- `expo-constants`

### 3. Configurar Supabase Auth

No Supabase Dashboard:

1. Vá em **Authentication** > **Providers**
2. Certifique-se de que **Email** está habilitado
3. Configure:
   - **Enable email confirmations**: Opcional (recomendado desabilitar para desenvolvimento)
   - **Enable email change confirmations**: Recomendado

4. Vá em **Authentication** > **URL Configuration**
5. Configure:
   - **Site URL**: `driverflow://`
   - **Redirect URLs**: 
     - `driverflow://`
     - `exp://localhost:8081` (para desenvolvimento)

## 🎨 Fluxo de Autenticação

### 1. Login
- Tela moderna com gradiente roxo
- Validação de email e senha
- Link para recuperação de senha
- Link para cadastro

### 2. Cadastro
- **Etapa 1**: Informações básicas (Nome, Email, Telefone)
- **Etapa 2**: Criação de senha (com confirmação)
- **Etapa 3**: Aceite de termos
- Indicador de progresso visual

### 3. Onboarding
Após o cadastro, o usuário passa por um onboarding em 3 etapas:

- **Etapa 1**: Seleção do tipo de veículo (Moto ou Carro)
- **Etapa 2**: Seleção/Cadastro de veículo
  - Lista de veículos populares
  - Opção de cadastrar veículo personalizado
- **Etapa 3**: Configuração inicial
  - R$ por km mínimo
  - R$ por hora mínimo
  - Preço do combustível
  - Perfil de trabalho

### 4. Recuperação de Senha
- Tela para solicitar recuperação
- Email de confirmação enviado
- Tela de sucesso após envio

## 🔒 Segurança

- Tokens JWT gerenciados pelo Supabase
- Sessões persistidas localmente
- Refresh automático de tokens
- Validação de dados no frontend
- Row Level Security (RLS) no banco

## 📱 Uso no App

### Verificar Autenticação

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainApp />;
}
```

### Fazer Login

```javascript
const { signIn } = useAuth();

const handleLogin = async () => {
  const result = await signIn(email, password);
  if (result.success) {
    // Login bem-sucedido
  } else {
    // Mostrar erro
    console.error(result.error);
  }
};
```

### Fazer Logout

```javascript
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut();
  // Usuário será redirecionado para tela de login
};
```

### Atualizar Perfil

```javascript
const { updateProfile } = useAuth();

const handleUpdate = async () => {
  const result = await updateProfile({
    full_name: 'Novo Nome',
    phone: '11999999999',
  });
  
  if (result.success) {
    // Perfil atualizado
  }
};
```

## 🐛 Troubleshooting

### Erro: "Supabase credentials not found"
- Verifique se as variáveis de ambiente estão configuradas
- Reinicie o servidor Expo após adicionar variáveis
- Use `expo start --clear` para limpar cache

### Erro: "Invalid login credentials"
- Verifique se o email está correto
- Confirme que a senha está correta
- Verifique se o usuário existe no Supabase

### Erro: "Organization not found"
- Execute o schema SQL do Supabase
- Verifique se o trigger de criação de organização está ativo
- Veja logs do Supabase para mais detalhes

### Onboarding não completa
- Verifique conexão com internet
- Confirme que o usuário tem uma organização
- Veja logs do console para erros específicos

## 📚 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [React Navigation Docs](https://reactnavigation.org/)
- [Expo Docs](https://docs.expo.dev/)

## ✅ Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas
- [ ] Supabase Auth configurado
- [ ] Schema do banco executado
- [ ] Testado login
- [ ] Testado cadastro
- [ ] Testado onboarding
- [ ] Testado recuperação de senha


