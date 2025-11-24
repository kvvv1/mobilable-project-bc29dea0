# 🔧 Configurar Variáveis de Ambiente

O aplicativo precisa das credenciais do Supabase para funcionar. Siga estes passos:

## 📝 Passo 1: Obter a Chave Anon do Supabase

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard/project/wlfmhygheizuuyohcbyj
2. Vá em **Settings** > **API**
3. Copie a chave **"anon public"** (não a service_role!)

## 📝 Passo 2: Criar Arquivo .env

Na pasta `mobile-app`, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://wlfmhygheizuuyohcbyj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=cole_a_chave_anon_aqui
```

**Exemplo:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://wlfmhygheizuuyohcbyj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZm1oeWdoZWl6dXV5b2hjYnlsaiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5ODc2NTIzLCJleHAiOjIwMDU0NTI1MjN9.sua_chave_aqui
```

## 📝 Passo 3: Reiniciar o Servidor

Após criar o arquivo `.env`, reinicie o servidor Expo:

```bash
cd mobile-app
npm start --clear
```

O `--clear` limpa o cache e garante que as novas variáveis sejam carregadas.

## ✅ Verificar se Funcionou

No console do app, você deve ver:
```
✅ Supabase configurado: https://wlfmhygheizuuyohcbyj.supabase.co
```

Se ainda aparecer erro, verifique:
- ✅ O arquivo `.env` está na pasta `mobile-app` (não em outra pasta)
- ✅ As variáveis começam com `EXPO_PUBLIC_`
- ✅ Não há espaços extras ou aspas nas variáveis
- ✅ Você reiniciou o servidor com `--clear`

## 🔒 Segurança

⚠️ **IMPORTANTE**: 
- O arquivo `.env` já está no `.gitignore` e não será commitado
- Nunca compartilhe sua chave anon publicamente
- Para produção, use variáveis de ambiente seguras

## 🆘 Ainda com Problemas?

Se ainda estiver com erro, você pode configurar diretamente no `app.config.js`:

```javascript
extra: {
  supabaseUrl: 'https://wlfmhygheizuuyohcbyj.supabase.co',
  supabaseAnonKey: 'sua_chave_anon_aqui',
}
```

Mas **não commite** o arquivo com a chave!

