# 🚀 Guia de Publicação - Google Play Store

Este guia passo a passo te ajudará a publicar o DriverFlow na Google Play Store.

---

## 📋 Pré-requisitos

Antes de começar, você precisa:

1. ✅ **Conta no Google Play Console**
   - Acesse: https://play.google.com/console
   - Cadastre-se ou faça login
   - Pague a taxa única de $25 USD (válida para sempre)

2. ✅ **Conta Expo**
   - Acesse: https://expo.dev
   - Crie uma conta gratuita

3. ✅ **EAS CLI Instalado**
   ```bash
   npm install -g eas-cli
   ```

4. ✅ **Git Instalado** (opcional, mas recomendado)

---

## 📝 Passo 1: Configurar Política de Privacidade

### 1.1. Hospedar a Política de Privacidade

A Play Store exige uma URL pública para a política de privacidade.

**Opções:**

**Opção A: GitHub Pages (Gratuito)**
1. Crie um repositório no GitHub
2. Faça upload do arquivo `PRIVACY_POLICY.md`
3. Ative GitHub Pages no repositório
4. A URL será: `https://seu-usuario.github.io/seu-repo/privacy-policy`

**Opção B: Hospedar em seu site**
1. Faça upload do arquivo para seu servidor
2. Certifique-se de que seja acessível via HTTPS

**Opção C: Usar serviços gratuitos**
- Netlify
- Vercel
- Firebase Hosting

### 1.2. Atualizar URL no Código

Depois de hospedar, atualize a URL no arquivo:

```javascript
// mobile-app/screens/PrivacyPolicyScreen.js
const PRIVACY_POLICY_URL = 'https://SUA-URL-AQUI/privacy-policy';
```

---

## 🔨 Passo 2: Configurar Build de Produção

### 2.1. Login no Expo

```bash
cd mobile-app
eas login
```

### 2.2. Configurar Projeto no Expo

```bash
eas build:configure
```

Isso criará/atualizará o arquivo `eas.json` (já configurado no projeto).

### 2.3. Gerar Keystore (Primeira vez apenas)

O Expo irá gerar automaticamente um keystore na primeira build. Você precisará:
1. Salvar as credenciais fornecidas
2. Guardar em local seguro

**Importante:** Se perder o keystore, não poderá atualizar o app!

### 2.4. Gerar Build de Produção

```bash
eas build --platform android --profile production
```

Este comando irá:
- Compilar o app
- Gerar AAB (Android App Bundle)
- Upload automático para o Expo

**Tempo estimado:** 15-30 minutos

### 2.5. Download do AAB

Após o build completar:
1. Acesse: https://expo.dev/accounts/seu-usuario/projects/driverflow/builds
2. Baixe o arquivo `.aab`
3. Ou aguarde o email de conclusão

---

## 🎨 Passo 3: Preparar Assets da Play Store

### 3.1. Ícone do App (512x512 pixels)

- ✅ Já existe em `mobile-app/assets/icon.png`
- ⚠️ Verifique se tem exatamente 512x512 pixels
- Se não tiver, redimensione

### 3.2. Screenshots (Mínimo 2, Máximo 8)

**Tamanhos necessários:**
- Telefone: 320px - 3840px (largura ou altura)
- Tablet: 320px - 3840px (largura ou altura)

**Recomendado:**
- 1080 x 1920 pixels (vertical)
- Ou 1920 x 1080 pixels (horizontal)

**Como criar:**
1. Abra o app no emulador/dispositivo
2. Tire screenshots das principais telas:
   - Dashboard
   - Captura de Corrida
   - Relatórios
   - Perfil

**Ferramentas úteis:**
- Android Studio (Device Manager)
- Genymotion
- Screenshot real do dispositivo

### 3.3. Feature Graphic (1024 x 500 pixels)

Uma imagem promocional que aparece na loja.

**Ferramentas para criar:**
- Canva (gratuito)
- Figma
- Photoshop
- GIMP (gratuito)

**O que incluir:**
- Logo do DriverFlow
- Texto: "Gestão Inteligente para Motoristas"
- Cores do app (roxo #8B5CF6)

### 3.4. Imagem do Ícone do App (512x512)

Certifique-se de que o arquivo existe e está correto:
- `mobile-app/assets/icon.png` (512x512 pixels)

---

## 📱 Passo 4: Criar App no Google Play Console

### 4.1. Criar Novo App

1. Acesse: https://play.google.com/console
2. Clique em "Criar aplicativo"
3. Preencha:
   - **Nome do aplicativo:** DriverFlow - Gestão para Motoristas
   - **Idioma padrão:** Português (Brasil)
   - **Tipo de aplicativo:** App
   - **Gratuito ou pago:** Gratuito
   - Clique em "Criar"

### 4.2. Configurar Categoria

1. Vá em "Categorização do aplicativo"
2. Selecione:
   - **Categoria principal:** Produtividade
   - **Tags:** Motorista, Transporte, Finanças, Gestão

---

## 📝 Passo 5: Preencher Informações do App

### 5.1. Descrição Curta (80 caracteres)

```
Gestão financeira inteligente para motoristas de aplicativos. Analise corridas, controle despesas e maximize seus ganhos.
```

### 5.2. Descrição Completa (até 4000 caracteres)

Use este template e personalize:

```
🚗 DriverFlow - Gestão Inteligente para Motoristas

O DriverFlow é o aplicativo completo para motoristas de aplicativos que querem gerenciar suas finanças de forma inteligente e maximizar seus ganhos.

📊 FUNCIONALIDADES PRINCIPAIS

✅ Dashboard Completo
- Visão geral das suas finanças
- Métricas de lucro líquido, receitas e despesas
- Insights inteligentes (melhor horário, melhor plataforma)
- Estatísticas em tempo real

✅ Captura de Corridas
- Tire foto da tela de proposta de corrida
- Preencha informações manualmente
- Análise automática de viabilidade
- Sistema inteligente que calcula se a corrida compensa

✅ Gestão Financeira
- Registre receitas de corridas
- Controle de despesas (combustível, manutenção, alimentação, etc.)
- Categorização automática de despesas
- Histórico completo

✅ Relatórios e Análises
- Gráficos de receitas e despesas
- Análise por plataforma (Uber, 99, iFood)
- Distribuição de despesas por tipo
- Relatórios por período (7, 30, 90 dias)

✅ Análise de Viabilidade
O app analisa automaticamente se cada corrida compensa baseado em:
- Valor da corrida
- Distância percorrida
- Tempo estimado
- Custo de combustível (calculado automaticamente)
- Custo de desgaste do veículo (por km)
- Valor da sua hora trabalhada

Resultado da Análise:
✅ Excelente - Margem > 50%
✅ Boa - Margem > 30%
⚠️ Razoável - Margem > 15%
⚠️ Ruim - Margem > 0%
❌ Péssima - Prejuízo garantido

🔒 PRIVACIDADE E SEGURANÇA

- Todos os dados são armazenados apenas no seu dispositivo
- Não enviamos dados para servidores externos
- Não compartilhamos informações com terceiros
- Processamento 100% local

💼 PERFEITO PARA

- Motoristas do Uber
- Motoristas do 99
- Entregadores do iFood
- Motoristas de aplicativos em geral

📱 REQUISITOS

- Android 5.0 ou superior
- Conexão com internet (opcional, para atualizações)

🎯 COMO USAR

1. Configure seus parâmetros (custo por KM, valor da hora, etc.)
2. Capture propostas de corrida
3. Registre suas despesas
4. Acompanhe relatórios e estatísticas
5. Maximize seus ganhos!

💡 DICA

Configure corretamente seus custos operacionais para análises mais precisas.

---

Baixe agora e comece a gerenciar suas corridas de forma inteligente!

Desenvolvido com ❤️ para motoristas de aplicativos
```

### 5.3. URL da Política de Privacidade

Cole a URL que você hospedou no Passo 1.

Exemplo: `https://seu-usuario.github.io/driverflow/privacy-policy`

### 5.4. URL de Suporte

Se você tiver um site ou email de suporte:

Exemplo: `mailto:suporte@driverflow.app`

Ou: `https://seu-site.com/suporte`

---

## 📤 Passo 6: Upload do AAB

### 6.1. Ir para Produção

1. No Google Play Console, vá em "Produção" (menu lateral)
2. Clique em "Criar nova versão"
3. Faça upload do arquivo `.aab` que você baixou

### 6.2. Preencher Notas de Versão

```
🎉 Primeira versão do DriverFlow!

Funcionalidades:
- Dashboard completo
- Captura e análise de corridas
- Gestão financeira
- Relatórios e estatísticas
- Análise de viabilidade automática
```

---

## 🖼️ Passo 7: Adicionar Assets

### 7.1. Ícone do App

1. Vá em "Grátis e programas" → "Grátis" → "Store listing"
2. Faça upload do ícone (512x512 pixels)

### 7.2. Screenshots

1. Na mesma seção, adicione seus screenshots
2. Adicione pelo menos 2, recomendado 4-6
3. Arraste para ordenar (o primeiro aparece como principal)

### 7.3. Feature Graphic

1. Adicione a imagem promocional (1024x500)
2. Esta imagem aparece na página do app na Play Store

---

## ✅ Passo 8: Declaração de Uso de Dados

### 8.1. Preencher Declaração

1. Vá em "Política" → "Declaração de uso de dados"
2. Responda as perguntas:

**O app coleta dados pessoais ou sensíveis?**
- ✅ Sim (você coleta dados de corridas e despesas)

**Tipos de dados:**
- ✅ Financeiro (corridas, despesas)
- ❌ Localização (não coletamos)
- ❌ Pessoalmente identificável (apenas dados locais)

**Como os dados são usados?**
- ✅ Para funcionalidades do app (análise de corridas)
- ❌ Para fins de marketing
- ❌ Compartilhamento com terceiros

**Dados armazenados:**
- ✅ Armazenados localmente no dispositivo
- ❌ Não enviados para servidores externos
- ❌ Não compartilhados

**Segurança:**
- ✅ Criptografados no dispositivo
- ✅ Acesso apenas pelo usuário

### 8.2. Link da Política

Adicione o link da sua política de privacidade aqui também.

---

## 🎯 Passo 9: Preencher Classificação de Conteúdo

### 9.1. Questionário

1. Vá em "Política" → "Classificação de conteúdo"
2. Responda o questionário:

- **Tem interação do usuário?** Sim
- **Tem compartilhamento de localização?** Não
- **Tem compras?** Não
- **Tem anúncios?** Não
- **Tem violência?** Não
- **Tem conteúdo sexual?** Não
- etc.

A classificação sugerida deve ser: **Todos**

---

## 📤 Passo 10: Revisar e Publicar

### 10.1. Checklist Final

Antes de publicar, verifique:

- [ ] AAB enviado
- [ ] Descrição preenchida
- [ ] Screenshots adicionados
- [ ] Ícone adicionado
- [ ] Feature graphic adicionada
- [ ] Política de privacidade linkada
- [ ] Declaração de uso de dados preenchida
- [ ] Classificação de conteúdo preenchida
- [ ] Categoria selecionada
- [ ] Todos os campos obrigatórios preenchidos

### 10.2. Enviar para Revisão

1. Vá em "Produção" → "Revisar versão"
2. Revise todas as informações
3. Clique em "Enviar para revisão"

### 10.3. Aguardar Aprovação

- ⏱️ **Tempo médio:** 1-7 dias
- Você receberá um email quando aprovado
- Pode demorar mais na primeira publicação

---

## 🎉 Passo 11: App Publicado!

Depois de aprovado:

1. ✅ Seu app estará disponível na Play Store
2. ✅ Você receberá um email de confirmação
3. ✅ O link será: `https://play.google.com/store/apps/details?id=com.driverflow.app`

---

## 🔄 Atualizações Futuras

Para publicar atualizações:

1. Atualize a versão no `app.json`:
   ```json
   "version": "1.0.1"
   ```

2. Atualize `versionCode` no Android:
   ```json
   "android": {
     "versionCode": 2
   }
   ```

3. Gere novo build:
   ```bash
   eas build --platform android --profile production
   ```

4. Faça upload no Play Console
5. Envie para revisão

---

## 🆘 Problemas Comuns

### Build falha

**Solução:**
- Verifique logs no Expo
- Certifique-se de que todas as dependências estão instaladas
- Execute: `npm install` novamente

### App rejeitado

**Motivos comuns:**
- Política de privacidade inacessível
- Declaração de uso de dados incompleta
- Screenshots de baixa qualidade
- Descrição muito curta

**Solução:**
- Revise o email de rejeição
- Corrija os problemas apontados
- Reenvie

### Não aparece na busca

**Solução:**
- Aguarde 24-48 horas após publicação
- Otimize palavras-chave na descrição
- Solicite avaliações de usuários

---

## 📚 Recursos Úteis

- [Google Play Console](https://play.google.com/console)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Políticas da Play Store](https://play.google.com/about/developer-content-policy/)
- [Guia de Assets](https://support.google.com/googleplay/android-developer/answer/9866151)

---

## ✅ Checklist Completo

Antes de começar, certifique-se:

- [ ] Conta no Google Play Console criada
- [ ] Taxa de $25 USD paga
- [ ] Conta Expo criada
- [ ] EAS CLI instalado
- [ ] Política de privacidade hospedada
- [ ] URL da política atualizada no código
- [ ] Build de produção gerado
- [ ] AAB baixado
- [ ] Screenshots criados (mínimo 2)
- [ ] Feature graphic criada (1024x500)
- [ ] Ícone verificado (512x512)
- [ ] Descrição do app escrita
- [ ] App criado no Play Console
- [ ] Todas as informações preenchidas
- [ ] Enviado para revisão

---

**Boa sorte com a publicação! 🚀**

Se precisar de ajuda, consulte:
- Documentação do Expo: https://docs.expo.dev
- Suporte do Google Play: https://support.google.com/googleplay


