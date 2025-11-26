# 📍 ONDE COLOCAR SUA LOGO

## 📂 Localização dos Arquivos

Coloque TODOS os arquivos da logo na pasta: **`mobile-app/assets/`**

---

## 📋 Arquivos Necessários e Suas Especificações

### 1. `icon.png` - Ícone Principal do App
- **Tamanho:** 1024 x 1024 pixels (obrigatório)
- **Formato:** PNG
- **Fundo:** Pode ser transparente ou com fundo sólido
- **Uso:** Ícone do app nas lojas (iOS/Android)

### 2. `splash-icon.png` - Logo da Tela de Loading
- **Tamanho:** 1024 x 1024 pixels (ou proporcional)
- **Formato:** PNG
- **Fundo:** TRANSPARENTE (recomendado)
- **Uso:** Tela de loading inicial do app
- **Observação:** O fundo será verde (#6BBD9B) automaticamente

### 3. `adaptive-icon.png` - Ícone Adaptativo Android
- **Tamanho:** 1024 x 1024 pixels
- **Formato:** PNG
- **Fundo:** TRANSPARENTE (obrigatório)
- **Uso:** Ícone do app no Android (versões 8.0+)
- **Importante:** O centro da imagem será mostrado (margem de segurança ~33% nas bordas)

### 4. `favicon.png` - Favicon Web
- **Tamanho:** 48 x 48 pixels ou 96 x 96 pixels
- **Formato:** PNG ou ICO
- **Fundo:** Pode ser transparente
- **Uso:** Ícone do app na versão web

---

## 🎨 Dicas de Preparação

### Para o `icon.png` e `adaptive-icon.png`:
- Seu logo com o pin de localização verde e a estrada
- Centralizado na imagem
- Deixe espaço nas bordas (especialmente para adaptive-icon)
- Fundo transparente funciona bem

### Para o `splash-icon.png`:
- Mesmo logo, pode ser maior
- Fundo transparente
- O app aplicará fundo verde automaticamente

### Para o `favicon.png`:
- Versão simplificada ou só o pin
- Menor tamanho (48x48 ou 96x96)

---

## ✅ Após Colocar os Arquivos

1. Substitua os arquivos existentes na pasta `mobile-app/assets/`
2. Mantenha os MESMOS NOMES:
   - `icon.png`
   - `splash-icon.png`
   - `adaptive-icon.png`
   - `favicon.png`

3. O app já está configurado para usar esses arquivos automaticamente!

---

## 🔄 Atualizar o App

Após colocar os arquivos, você pode:
- Reiniciar o app para ver a logo no loading
- Os ícones do app serão atualizados no próximo build

---

## 📝 Checklist

- [ ] `icon.png` (1024x1024) colocado em `mobile-app/assets/`
- [ ] `splash-icon.png` (1024x1024) colocado em `mobile-app/assets/`
- [ ] `adaptive-icon.png` (1024x1024) colocado em `mobile-app/assets/`
- [ ] `favicon.png` (48x48 ou 96x96) colocado em `mobile-app/assets/`

