import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    id: 1,
    icon: 'home',
    title: 'Dashboard',
    subtitle: 'Visão Geral',
    description: 'Aqui você vê todas as suas métricas financeiras em tempo real: lucro líquido, receitas, despesas e insights inteligentes sobre seus melhores horários e plataformas.',
    color: '#8B5CF6',
    features: [
      '💰 Lucro líquido do período',
      '📊 Gráficos de receitas e despesas',
      '⭐ Insights sobre melhor horário',
      '🏆 Melhor plataforma de trabalho',
    ],
  },
  {
    id: 2,
    icon: 'camera',
    title: 'Capturar Corrida',
    subtitle: 'Análise Inteligente',
    description: 'Tire uma foto da proposta de corrida ou preencha manualmente. O app analisa automaticamente se a corrida compensa baseado em distância, tempo, custos e sua hora trabalhada.',
    color: '#10B981',
    features: [
      '📸 Captura por foto ou manual',
      '🧮 Análise automática de viabilidade',
      '✅ Classificação: Excelente, Boa, Razoável, Ruim',
      '💡 Recomendações inteligentes',
    ],
  },
  {
    id: 3,
    icon: 'remove-circle',
    title: 'Adicionar Despesas',
    subtitle: 'Controle Total',
    description: 'Registre todas as suas despesas: combustível, manutenção, alimentação, estacionamento e muito mais. O app categoriza automaticamente para facilitar sua análise.',
    color: '#F59E0B',
    features: [
      '⛽ Combustível',
      '🔧 Manutenção',
      '🍔 Alimentação',
      '📋 Outras categorias',
    ],
  },
  {
    id: 4,
    icon: 'bar-chart',
    title: 'Relatórios',
    subtitle: 'Análise Detalhada',
    description: 'Visualize gráficos completos de suas finanças por período (7, 30, 90 dias), análise por plataforma e distribuição de despesas por tipo.',
    color: '#3B82F6',
    features: [
      '📈 Gráficos interativos',
      '📅 Análise por período',
      '🚗 Análise por plataforma',
      '💸 Distribuição de despesas',
    ],
  },
  {
    id: 5,
    icon: 'person',
    title: 'Perfil',
    subtitle: 'Seus Dados',
    description: 'Gerencie seu perfil, veja histórico de corridas, configure metas e objetivos, e gerencie seus veículos cadastrados.',
    color: '#EC4899',
    features: [
      '👤 Dados pessoais',
      '📝 Histórico completo',
      '🎯 Metas e objetivos',
      '🚗 Gestão de veículos',
    ],
  },
  {
    id: 6,
    icon: 'settings',
    title: 'Configurações',
    subtitle: 'Personalize',
    description: 'Configure seus parâmetros de análise: custos operacionais, consumo do veículo, preço do combustível e muito mais para análises precisas.',
    color: '#6366F1',
    features: [
      '⚙️ Parâmetros de análise',
      '🚗 Configuração de veículos',
      '⛽ Preço do combustível',
      '💼 Valor da sua hora',
    ],
  },
];

export default function TutorialScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { completeTutorial } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const handleFinish = async () => {
    try {
      await completeTutorial();
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 300));
      // Não navegar manualmente aqui - o App.js vai detectar que tutorial está completo
      // e mostrará o app principal automaticamente
      // Fluxo: CADASTRO → ONBOARDING → TUTORIAL → APP (gerenciado pelo App.js)
    } catch (error) {
      console.error('Erro ao completar tutorial:', error);
      // Erro silenciado - navegação será gerenciada pelo App.js
    }
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
          >
            <Text style={styles.skipButtonText}>Pular</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} de {TUTORIAL_STEPS.length}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: `${step.color}15` }]}>
              <Ionicons
                name={step.icon}
                size={64}
                color={step.color}
              />
            </View>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <Text style={styles.description}>{step.description}</Text>

          <View style={styles.featuresContainer}>
            {step.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={step.color}
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.pagination}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentStep && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonsContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text style={styles.backButtonText}>Voltar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextButton, { backgroundColor: step.color }]}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === TUTORIAL_STEPS.length - 1
                  ? 'Começar'
                  : 'Próximo'}
              </Text>
              <Ionicons
                name={
                  currentStep === TUTORIAL_STEPS.length - 1
                    ? 'checkmark'
                    : 'arrow-forward'
                }
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 12,
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#8B5CF6',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

