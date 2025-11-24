# 🚀 Guia de Configuração para Produção

## ⚠️ ANTES DE PUBLICAR

### 1. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Preencha com suas credenciais do Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

3. **NUNCA** commite o arquivo `.env` no Git (já está no .gitignore)

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará a nova dependência `@react-native-community/netinfo` para verificação de conexão.

### 3. Verificar Configurações

- ✅ Credenciais hardcoded removidas
- ✅ Logger condicional implementado
- ✅ Console.log substituído por logger
- ✅ .gitignore configurado

### 4. Gerar Build de Produção

```bash
# Fazer login no EAS
eas login

# Gerar build de produção
eas build --platform android --profile production
```

### 5. Testar Build

- Baixe o AAB gerado
- Instale em um dispositivo físico
- Teste todas as funcionalidades principais
- Verifique se não há crashes

## 📋 Checklist Final

- [ ] Arquivo `.env` criado e preenchido
- [ ] Dependências instaladas (`npm install`)
- [ ] Build de produção gerado
- [ ] Build testado em dispositivo físico
- [ ] Política de privacidade hospedada
- [ ] Screenshots criados
- [ ] Feature graphic criado

## 🔒 Segurança

- ✅ Credenciais não estão no código
- ✅ Logger não expõe informações em produção
- ✅ .env está no .gitignore
- ✅ Validações de entrada implementadas

## 📱 Próximos Passos

1. Hospedar política de privacidade
2. Criar assets (screenshots, feature graphic)
3. Preencher informações no Google Play Console
4. Enviar para revisão

---

**Última atualização:** 2024


