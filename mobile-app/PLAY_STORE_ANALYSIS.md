# 🔍 Análise de Conformidade - Google Play Store

## ❌ **NÃO ESTÁ APTO PARA PUBLICAR NA PLAY STORE**

Data da análise: 2024

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. ⚠️ **Permissões Sensíveis Declaradas Sem Implementação**

**Problema:**
O app declara permissões sensíveis no `app.json` que não estão implementadas:

```32:34:mobile-app/app.json
        "SYSTEM_ALERT_WINDOW",
        "BIND_ACCESSIBILITY_SERVICE",
        "FOREGROUND_SERVICE"
```

**Por que é problemático:**
- A Google Play Store **rejeita** apps que declaram permissões sensíveis sem usá-las adequadamente
- O código atual apenas **simula** essas funcionalidades (`overlayService.js`)
- Não há módulo nativo Android implementado

**Solução:**
1. **Remover essas permissões do `app.json`** se não forem implementadas na versão inicial
2. OU implementar completamente o módulo nativo antes de publicar
3. Adicionar justificativa clara de uso das permissões

---

### 2. 🚫 **AccessibilityService - Violação de Políticas da Google**

**Problema:**
O app planeja usar `AccessibilityService` para:
- Ler conteúdo de outros apps (Uber, 99, iFood)
- Extrair dados de corridas automaticamente
- Criar overlay sobre outros apps

**Por que é problemático:**
- A Google **proíbe** o uso de `AccessibilityService` para fins comerciais ou para ler conteúdo de outros apps
- Essa é uma das políticas **mais estritas** da Play Store
- Apps que violam isso são **removidos imediatamente**

**Política da Google:**
> "AccessibilityService deve ser usado apenas para fins legítimos de acessibilidade. Não pode ser usado para ler conteúdo de outros apps para fins comerciais."

**Exemplos de rejeição:**
- Apps que monitoram outros apps (como o Gigu)
- Apps que extraem dados de terceiros usando Accessibility
- Overlay tools que usam Accessibility para ler telas

**Solução:**
1. **NÃO implementar** AccessibilityService se quiser publicar na Play Store
2. Remover a funcionalidade de overlay ou torná-la manual
3. Usar alternativa: captura manual de screenshot (já implementado)

---

### 3. 📋 **Falta de Política de Privacidade**

**Problema:**
Não há política de privacidade no projeto.

**Por que é necessário:**
- Play Store **exige** política de privacidade para TODOS os apps
- Especialmente obrigatório para apps que:
  - Coletam dados do usuário (corridas, despesas)
  - Usam permissões sensíveis (câmera, armazenamento)
  - Armazenam informações financeiras

**O que precisa ter:**
- URL pública e acessível da política
- Explicação de quais dados são coletados
- Como os dados são usados
- Como os dados são armazenados (local/cloud)
- Direitos do usuário (exclusão, exportação)

**Solução:**
1. Criar política de privacidade completa
2. Hospedar em URL pública (ex: seu domínio ou GitHub Pages)
3. Adicionar link no Google Play Console
4. Adicionar link dentro do app (tela de Configurações/Perfil)

---

### 4. 📦 **Falta de Arquivos Essenciais**

**Problemas encontrados:**
- ❌ Não há `AndroidManifest.xml` customizado (Expo usa o padrão)
- ❌ Não há `proguard-rules.pro` (proteção de código)
- ❌ Não há configuração de assinatura do APK/AAB
- ❌ Não há descrição detalhada para a Play Store

**Solução:**
1. Criar build production: `eas build --platform android`
2. Configurar assinatura com keystore
3. Gerar AAB (Android App Bundle) - formato exigido pela Play Store

---

### 5. 🎨 **Ícones e Assets**

**Status:**
✅ Ícones presentes em `assets/`
- `icon.png`
- `adaptive-icon.png`
- `splash-icon.png`

**Verificações necessárias:**
- [ ] Ícone de 512x512 pixels (exigido pela Play Store)
- [ ] Ícone adaptativo (Android 8.0+)
- [ ] Screenshots da Play Store (mínimo 2, máximo 8)
- [ ] Feature graphic (1024x500 pixels)

---

## ✅ FUNCIONALIDADES APTAS

### 1. **Captura Manual de Corridas** ✅
- Usa `expo-image-picker` (permissão adequada)
- Não viola políticas
- Funcionalidade implementada corretamente

### 2. **Gestão Financeira** ✅
- Armazenamento local (AsyncStorage)
- Não coleta dados de terceiros
- Conformidade OK

### 3. **Análise de Viabilidade** ✅
- Cálculos locais
- Não depende de serviços externos
- OK para Play Store

---

## 📝 CHECKLIST ANTES DE PUBLICAR

### Políticas e Conformidade
- [ ] Remover permissões não utilizadas (`BIND_ACCESSIBILITY_SERVICE`, `SYSTEM_ALERT_WINDOW`, `FOREGROUND_SERVICE`)
- [ ] Criar e publicar Política de Privacidade
- [ ] Adicionar link de política no app
- [ ] Revisar Declaração de Uso de Dados no Play Console

### Build e Assinatura
- [ ] Configurar EAS Build ou fazer eject do Expo
- [ ] Criar keystore para assinatura
- [ ] Gerar AAB (Android App Bundle)
- [ ] Testar build de produção

### Conteúdo da Play Store
- [ ] Escrever descrição do app (até 4000 caracteres)
- [ ] Preparar screenshots (mínimo 2, tamanho adequado)
- [ ] Criar feature graphic (1024x500)
- [ ] Definir categoria do app
- [ ] Adicionar tags e palavras-chave

### Testes
- [ ] Testar em diferentes versões do Android
- [ ] Testar permissões (câmera, armazenamento)
- [ ] Verificar se não há crashes
- [ ] Testar fluxo completo do usuário

### Assets
- [ ] Ícone 512x512 pixels
- [ ] Screenshots para diferentes telas
- [ ] Vídeo promocional (opcional, mas recomendado)

---

## 🔧 RECOMENDAÇÕES IMEDIATAS

### 1. **Remover Funcionalidade de Overlay (Temporariamente)**

Como a funcionalidade de overlay não está implementada e violaria políticas, recomendo:

```json
// app.json - REMOVER estas permissões:
"permissions": [
  "CAMERA",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE"
  // REMOVER: SYSTEM_ALERT_WINDOW, BIND_ACCESSIBILITY_SERVICE, FOREGROUND_SERVICE
]
```

### 2. **Remover ou Esconder Tela de Overlay**

- Remover `OverlayScreen.js` da navegação
- OU manter apenas com aviso de "em desenvolvimento"
- Não solicitar permissões de acessibilidade

### 3. **Focar nas Funcionalidades Principais**

O app tem valor suficiente sem o overlay:
- ✅ Captura manual de corridas
- ✅ Análise de viabilidade
- ✅ Gestão financeira
- ✅ Relatórios e estatísticas

Essas funcionalidades **são suficientes** para um app útil na Play Store.

---

## 📊 RESUMO

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Permissões sensíveis | ❌ | Remover do app.json |
| AccessibilityService | ❌ | Não implementar |
| Política de Privacidade | ❌ | Criar e publicar |
| Build de Produção | ❌ | Configurar EAS Build |
| Ícones/Assets | ✅ | Verificar tamanhos |
| Funcionalidades core | ✅ | OK |

---

## 🎯 PLANO DE AÇÃO

### Fase 1: Limpeza (1-2 dias)
1. Remover permissões não utilizadas do `app.json`
2. Remover/esconder funcionalidade de overlay
3. Atualizar documentação

### Fase 2: Conformidade (2-3 dias)
1. Criar política de privacidade
2. Hospedar política em URL pública
3. Adicionar link no app

### Fase 3: Build (1-2 dias)
1. Configurar EAS Build
2. Gerar AAB de produção
3. Testar build

### Fase 4: Publicação (1 dia)
1. Criar conta no Google Play Console
2. Preencher informações do app
3. Upload do AAB
4. Submeter para revisão

---

## ⚠️ AVISO IMPORTANTE

**NÃO TENTE PUBLICAR O APP COM AS PERMISSÕES DE ACCESSIBILITY DECLARADAS**

A Google rejeita imediatamente apps que:
- Declaram `BIND_ACCESSIBILITY_SERVICE` sem uso legítimo
- Usam Accessibility para ler outros apps
- Violam políticas de acessibilidade

Isso pode resultar em:
- ❌ Rejeição imediata do app
- ❌ Possível suspensão da conta do desenvolvedor
- ❌ Dificuldade para publicar apps futuros

---

## 📚 REFERÊNCIAS

- [Google Play Policy - Accessibility Services](https://support.google.com/googleplay/android-developer/answer/9888170)
- [Google Play Policy - Sensitive Permissions](https://support.google.com/googleplay/android-developer/answer/9888170)
- [Google Play Policy - User Data](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)

---

**Última atualização:** 2024
**Status:** ❌ Não apto para publicação (requer correções)


