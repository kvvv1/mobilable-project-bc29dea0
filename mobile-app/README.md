# DriverFlow - Gestão Inteligente para Motoristas

Aplicativo completo de gestão financeira e análise de corridas para motoristas de aplicativos (Uber, 99, iFood).

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral completa das suas finanças
- Métricas de lucro líquido, receitas e despesas
- Insights inteligentes (melhor horário, melhor plataforma)
- Estatísticas em tempo real

### 📸 Captura de Corridas
- Tire foto da tela de proposta de corrida
- Preencha informações manualmente
- Análise automática de viabilidade
- Sistema inteligente que calcula se a corrida compensa

### 💰 Gestão Financeira
- Registre receitas de corridas
- Controle de despesas (combustível, manutenção, alimentação, etc.)
- Categorização automática de despesas
- Histórico completo

### 📈 Relatórios e Análises
- Gráficos de receitas e despesas
- Análise por plataforma
- Distribuição de despesas por tipo
- Relatórios por período (7, 30, 90 dias)

### ⚙️ Configurações
- Personalize custos operacionais
- Configure média de consumo do veículo
- Defina preço do combustível
- Ajuste parâmetros de análise

## 📱 Análise de Viabilidade

O app analisa automaticamente se cada corrida compensa baseado em:

- 💵 **Valor da corrida**
- 🛣️ **Distância percorrida**
- ⏱️ **Tempo estimado**
- ⛽ **Custo de combustível** (calculado automaticamente)
- 🔧 **Custo de desgaste do veículo** (por km)
- 💼 **Valor da sua hora** trabalhada

**Resultado da Análise:**
- ✅ **Excelente** - Margem > 50%
- ✅ **Boa** - Margem > 30%
- ⚠️ **Razoável** - Margem > 15%
- ⚠️ **Ruim** - Margem > 0%
- ❌ **Péssima** - Prejuízo garantido

## 🛠️ Tecnologias

- **React Native** com Expo
- **React Navigation** para navegação
- **AsyncStorage** para armazenamento local
- **React Native Chart Kit** para gráficos
- **Expo Image Picker** para captura de imagens
- **Moment.js** para manipulação de datas

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
# ou
yarn install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm start
# ou
expo start
```

3. Escaneie o QR code com o app Expo Go (Android/iOS)

## 🎨 Design

O app foi desenvolvido com foco em:
- Interface moderna e intuitiva
- Design inspirado em apps financeiros (Nubank, Conta Azul)
- Cores vibrantes e profissionais
- Experiência de usuário fluida

## 📝 Como Usar

### 1. Configurar Parâmetros
Acesse a aba "Configurações" e configure:
- Custo por KM do seu veículo
- Valor da sua hora trabalhada
- Média de KM por litro
- Preço atual do combustível

### 2. Capturar Corridas
1. Quando receber uma proposta de corrida, tire uma foto da tela
2. Preencha os dados (ou deixe a IA extrair no futuro)
3. O app calcula automaticamente se compensa
4. Salve a corrida

### 3. Registrar Despesas
1. Vá em "Adicionar Despesa"
2. Escolha o tipo (combustível, manutenção, etc.)
3. Informe o valor e descrição
4. Salve

### 4. Acompanhar Relatórios
Acesse a aba "Relatórios" para ver:
- Gráficos de receitas
- Distribuição por plataforma
- Análise de despesas
- Tendências e insights

## 🎯 Overlay Inteligente (Estilo Gigu)

O app inclui uma funcionalidade de **overlay flutuante** inspirada no **GigU (Gigu)**:

- ✅ **Interface de configuração** para ativar overlay
- ✅ **Solicitação de permissões** (sobreposição e acessibilidade)
- ✅ **Guia de implementação** nativa Android completa
- ⚠️ **Requer módulo nativo** para funcionamento completo

### Como Funciona o Overlay (quando implementado)

1. **AccessibilityService** - Monitora a tela automaticamente
2. **Detecção Automática** - Identifica quando apps de corrida mostram proposta
3. **Extração Automática** - Extrai valor, distância e tempo da tela
4. **Análise em Tempo Real** - Calcula se compensa instantaneamente
5. **Semáforo Visual** - Mostra cores (verde/amarelo/vermelho) no overlay

### Implementação Nativa

Para implementar o overlay completo, consulte o arquivo `android-overlay-guide.md` que contém:
- Código Java completo do AccessibilityService
- Código Java do OverlayService
- Estrutura de módulo nativo React Native
- Permissões necessárias no AndroidManifest

⚠️ **Nota**: O overlay requer desenvolvimento nativo Android. A versão atual simula a interface, mas não funciona completamente no Expo Go. Para usar, é necessário fazer eject do Expo ou usar Development Build.

## 🔮 Funcionalidades Futuras

- [ ] Implementação completa do overlay nativo Android
- [ ] OCR com IA para extrair dados automaticamente das fotos
- [ ] Exportação de relatórios em PDF
- [ ] Sincronização em nuvem
- [ ] Modo offline completo
- [ ] Notificações inteligentes
- [ ] Metas e objetivos de ganhos
- [ ] Histórico de localizações

## 📄 Licença

Este projeto é privado.

## 👨‍💻 Desenvolvimento

Desenvolvido com ❤️ para motoristas de aplicativos

---

**DriverFlow v1.0.0** - Gestão Inteligente para Motoristas

