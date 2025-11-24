import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/storage';
import { Formatters } from '../utils/formatters';

const PERFIS_TRABALHO = [
  { id: 'giro-rapido', label: 'Giro Rápido', icon: '⚡', desc: 'Prefere corridas curtas e rápidas' },
  { id: 'corridas-longas', label: 'Corridas Longas', icon: '🚗', desc: 'Prefere valor alto por corrida' },
  { id: 'misto', label: 'Misto', icon: '🔄', desc: 'Equilibra corridas curtas e longas' },
];

const PLATAFORMAS = [
  { id: 'uber', label: 'Uber', icon: 'car' },
  { id: '99', label: '99', icon: 'car-sport' },
  { id: 'ifood', label: 'iFood', icon: 'restaurant' },
];

// Perfis pré-feitos com valores recomendados baseados no mercado brasileiro
const PERFIS_PREFEITOS = [
  {
    id: 'moto-giro-rapido',
    tipoVeiculo: 'moto',
    label: 'Moto - Giro Rápido',
    icon: '🏍️',
    desc: 'Ideal para entregas iFood e corridas curtas',
    recomendacao: 'Perfeito para quem quer fazer muitas corridas rápidas e aumentar o volume diário',
    config: {
      rsPorKmMinimo: '1.50',
      rsPorHoraMinimo: '22.00',
      distanciaMaxima: '6',
      tempoMaximoEstimado: '20',
      mediaKmPorLitro: '35',
      precoCombustivel: '6.00',
      perfilTrabalho: 'giro-rapido',
      distanciaMaximaCliente: '1.2',
      custoKm: '0.30',
      custoHora: '18.00',
      tipoVeiculo: 'moto',
    },
  },
  {
    id: 'moto-corridas-longas',
    tipoVeiculo: 'moto',
    label: 'Moto - Corridas Longas',
    icon: '🏍️',
    desc: 'Ideal para corridas de passageiros longas',
    recomendacao: 'Melhor para quem prefere menos corridas mas com maior valor por viagem',
    config: {
      rsPorKmMinimo: '1.80',
      rsPorHoraMinimo: '28.00',
      distanciaMaxima: '15',
      tempoMaximoEstimado: '45',
      mediaKmPorLitro: '35',
      precoCombustivel: '6.00',
      perfilTrabalho: 'corridas-longas',
      distanciaMaximaCliente: '2.0',
      custoKm: '0.30',
      custoHora: '22.00',
      tipoVeiculo: 'moto',
    },
  },
  {
    id: 'moto-misto',
    tipoVeiculo: 'moto',
    label: 'Moto - Misto',
    icon: '🏍️',
    desc: 'Equilibra corridas curtas e longas',
    recomendacao: 'Versátil para aceitar qualquer tipo de corrida que aparecer',
    config: {
      rsPorKmMinimo: '1.65',
      rsPorHoraMinimo: '25.00',
      distanciaMaxima: '10',
      tempoMaximoEstimado: '30',
      mediaKmPorLitro: '35',
      precoCombustivel: '6.00',
      perfilTrabalho: 'misto',
      distanciaMaximaCliente: '1.5',
      custoKm: '0.30',
      custoHora: '20.00',
      tipoVeiculo: 'moto',
    },
  },
  {
    id: 'carro-giro-rapido',
    tipoVeiculo: 'carro',
    label: 'Carro - Giro Rápido',
    icon: '🚗',
    desc: 'Ideal para corridas urbanas curtas',
    recomendacao: 'Perfeito para corridas rápidas no centro da cidade',
    config: {
      rsPorKmMinimo: '2.20',
      rsPorHoraMinimo: '30.00',
      distanciaMaxima: '7',
      tempoMaximoEstimado: '25',
      mediaKmPorLitro: '12',
      precoCombustivel: '6.00',
      perfilTrabalho: 'giro-rapido',
      distanciaMaximaCliente: '1.5',
      custoKm: '0.60',
      custoHora: '25.00',
      tipoVeiculo: 'carro',
    },
  },
  {
    id: 'carro-corridas-longas',
    tipoVeiculo: 'carro',
    label: 'Carro - Corridas Longas',
    icon: '🚗',
    desc: 'Ideal para aeroporto e viagens longas',
    recomendacao: 'Melhor para corridas de alto valor como aeroporto e interurbanas',
    config: {
      rsPorKmMinimo: '2.50',
      rsPorHoraMinimo: '35.00',
      distanciaMaxima: '20',
      tempoMaximoEstimado: '50',
      mediaKmPorLitro: '12',
      precoCombustivel: '6.00',
      perfilTrabalho: 'corridas-longas',
      distanciaMaximaCliente: '2.5',
      custoKm: '0.60',
      custoHora: '28.00',
      tipoVeiculo: 'carro',
    },
  },
  {
    id: 'carro-misto',
    tipoVeiculo: 'carro',
    label: 'Carro - Misto',
    icon: '🚗',
    desc: 'Equilibra todos os tipos de corrida',
    recomendacao: 'Versátil para aceitar qualquer corrida que aparecer',
    config: {
      rsPorKmMinimo: '2.35',
      rsPorHoraMinimo: '32.00',
      distanciaMaxima: '12',
      tempoMaximoEstimado: '35',
      mediaKmPorLitro: '12',
      precoCombustivel: '6.00',
      perfilTrabalho: 'misto',
      distanciaMaximaCliente: '2.0',
      custoKm: '0.60',
      custoHora: '26.00',
      tipoVeiculo: 'carro',
    },
  },
];

export default function ConfiguracoesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, toggleTheme } = useTheme();
  
  // Helper para estilos de input com tema
  const getThemedInputStyle = () => ({
    backgroundColor: theme.colors.input,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  });
  const [config, setConfig] = useState({
    // Parâmetros principais
    rsPorKmMinimo: '',
    rsPorHoraMinimo: '',
    distanciaMaxima: '',
    tempoMaximoEstimado: '',
    mediaKmPorLitro: '',
    precoCombustivel: '',
    perfilTrabalho: 'misto',
    tipoVeiculo: 'auto', // 'moto', 'carro', 'auto' (detecção automática)
    // Parâmetros avançados
    distanciaMaximaCliente: '',
    preferenciasApps: {
      uber: { preferido: false, evitar: false },
      '99': { preferido: false, evitar: false },
      ifood: { preferido: false, evitar: false },
    },
    metaDiariaLucro: '',
    // Mantendo compatibilidade com versão antiga
    custoKm: '',
    custoHora: '',
  });
  const [showAvancados, setShowAvancados] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [veiculoCadastrado, setVeiculoCadastrado] = useState(null);

  // Detectar tipo de veículo baseado no consumo médio
  const detectarTipoVeiculo = (consumo) => {
    if (!consumo) return 'auto';
    const consumoNum = parseFloat(consumo.toString().replace(',', '.'));
    if (consumoNum >= 25) return 'moto'; // Moto geralmente tem consumo > 25 km/L
    if (consumoNum <= 20) return 'carro'; // Carro geralmente tem consumo < 20 km/L
    return 'auto'; // Não detectado
  };

  // Obter tipo de veículo atual (configurado ou detectado)
  const getTipoVeiculoAtual = () => {
    if (config.tipoVeiculo && config.tipoVeiculo !== 'auto') {
      return config.tipoVeiculo;
    }
    return detectarTipoVeiculo(config.mediaKmPorLitro);
  };

  // Filtrar perfis baseado no tipo de veículo
  const getPerfisFiltrados = () => {
    const tipoAtual = getTipoVeiculoAtual();
    if (tipoAtual === 'auto') {
      return PERFIS_PREFEITOS; // Mostra todos se não detectado
    }
    return PERFIS_PREFEITOS.filter(p => p.tipoVeiculo === tipoAtual);
  };


  useEffect(() => {
    loadConfig();
    
    // Recarregar quando a tela voltar ao foco (após selecionar veículo no perfil)
    const unsubscribe = navigation.addListener('focus', () => {
      loadConfig();
    });

    return unsubscribe;
  }, [navigation]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const configData = await StorageService.getConfig();
      const consumo = configData.mediaKmPorLitro?.toString() || '12';
      const tipoDetectado = detectarTipoVeiculo(consumo);
      
      // Carregar dados do veículo se existirem
      const veiculoData = configData.veiculo || {};
      if (veiculoData.modelo) {
        setVeiculoCadastrado(veiculoData);
      } else {
        setVeiculoCadastrado(null);
      }
      
      setConfig({
        // Parâmetros principais
        rsPorKmMinimo: configData.rsPorKmMinimo?.toString() || configData.custoKm?.toString() || '1.80',
        rsPorHoraMinimo: configData.rsPorHoraMinimo?.toString() || configData.custoHora?.toString() || '25.00',
        distanciaMaxima: configData.distanciaMaxima?.toString() || '10',
        tempoMaximoEstimado: configData.tempoMaximoEstimado?.toString() || '30',
        mediaKmPorLitro: consumo,
        precoCombustivel: configData.precoCombustivel?.toString() || '6.00',
        perfilTrabalho: configData.perfilTrabalho || 'misto',
        tipoVeiculo: configData.tipoVeiculo || tipoDetectado,
        // Parâmetros avançados
        distanciaMaximaCliente: configData.distanciaMaximaCliente?.toString() || '1.5',
        preferenciasApps: configData.preferenciasApps || {
          uber: { preferido: false, evitar: false },
          '99': { preferido: false, evitar: false },
          ifood: { preferido: false, evitar: false },
        },
        metaDiariaLucro: configData.metaDiariaLucro?.toString() || '',
        // Compatibilidade
        custoKm: configData.custoKm?.toString() || '0.5',
        custoHora: configData.custoHora?.toString() || '20',
      });
    } catch (error) {
      // Erro silenciado - configurações padrão serão usadas
    } finally {
      setLoading(false);
    }
  };

  const salvarConfig = async () => {
    // Validar campos obrigatórios principais
    if (!config.rsPorKmMinimo || !config.rsPorHoraMinimo || !config.distanciaMaxima || 
        !config.tempoMaximoEstimado || !config.mediaKmPorLitro || !config.precoCombustivel) {
      Alert.alert('Atenção', 'Preencha todos os campos principais.');
      return;
    }

    setSaving(true);
    try {
      const configData = {
        // Parâmetros principais
        rsPorKmMinimo: parseFloat(config.rsPorKmMinimo.replace(',', '.')),
        rsPorHoraMinimo: parseFloat(config.rsPorHoraMinimo.replace(',', '.')),
        distanciaMaxima: parseFloat(config.distanciaMaxima.replace(',', '.')),
        tempoMaximoEstimado: parseFloat(config.tempoMaximoEstimado.replace(',', '.')),
        mediaKmPorLitro: parseFloat(config.mediaKmPorLitro.replace(',', '.')),
        precoCombustivel: parseFloat(config.precoCombustivel.replace(',', '.')),
        // perfilTrabalho e tipoVeiculo são gerenciados no Perfil, não aqui
        // Mantém os valores do storage se existirem
        perfilTrabalho: configData.perfilTrabalho || 'misto',
        tipoVeiculo: getTipoVeiculoAtual(),
        // Parâmetros avançados
        distanciaMaximaCliente: config.distanciaMaximaCliente ? parseFloat(config.distanciaMaximaCliente.replace(',', '.')) : 1.5,
        preferenciasApps: config.preferenciasApps,
        metaDiariaLucro: config.metaDiariaLucro ? parseFloat(config.metaDiariaLucro.replace(',', '.')) : null,
        // Mantendo compatibilidade
        custoKm: config.custoKm ? parseFloat(config.custoKm.replace(',', '.')) : 0.5,
        custoHora: config.custoHora ? parseFloat(config.custoHora.replace(',', '.')) : 20,
      };

      await StorageService.saveConfig(configData);
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      // Erro já tratado no Alert
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  const atualizarPreferenciaApp = (appId, tipo, valor) => {
    setConfig({
      ...config,
      preferenciasApps: {
        ...config.preferenciasApps,
        [appId]: {
          ...config.preferenciasApps[appId],
          [tipo]: valor,
          // Se marcar "preferido", desmarca "evitar" e vice-versa
          ...(tipo === 'preferido' && valor ? { evitar: false } : {}),
          ...(tipo === 'evitar' && valor ? { preferido: false } : {}),
        },
      },
    });
  };

  const aplicarPerfilPrefeito = (perfil) => {
    const detalhes = `📊 Valores do Perfil:\n\n` +
      `• R$/km mínimo: R$ ${perfil.config.rsPorKmMinimo}\n` +
      `• R$/hora mínimo: R$ ${perfil.config.rsPorHoraMinimo}\n` +
      `• Distância máxima: ${perfil.config.distanciaMaxima} km\n` +
      `• Tempo máximo: ${perfil.config.tempoMaximoEstimado} min\n` +
      `• Consumo: ${perfil.config.mediaKmPorLitro} km/L\n` +
      `• Combustível: R$ ${perfil.config.precoCombustivel}/L\n` +
      `• Perfil: ${PERFIS_TRABALHO.find(p => p.id === perfil.config.perfilTrabalho)?.label || 'Misto'}\n\n` +
      `💡 ${perfil.recomendacao}`;

    Alert.alert(
      `Aplicar Perfil: ${perfil.label}?`,
      detalhes,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar Perfil',
          style: 'default',
          onPress: () => {
            setConfig({
              ...config,
              ...perfil.config,
              // Manter preferências de apps e meta diária se já existirem
              preferenciasApps: config.preferenciasApps,
              metaDiariaLucro: config.metaDiariaLucro || '',
              // Atualizar tipo de veículo baseado no perfil
              tipoVeiculo: perfil.tipoVeiculo,
            });
            Alert.alert(
              '✅ Perfil Aplicado!',
              `O perfil "${perfil.label}" foi aplicado com sucesso!\n\nVocê pode ajustar os valores manualmente na seção "Configuração Manual" se necessário.`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const limparDados = () => {
    Alert.alert(
      'Atenção',
      'Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Limpar todas as corridas e despesas
              const corridas = await StorageService.getCorridas();
              const despesas = await StorageService.getDespesas();

              for (const corrida of corridas) {
                await StorageService.deleteCorrida(corrida.id);
              }

              for (const despesa of despesas) {
                await StorageService.deleteDespesa(despesa.id);
              }

              Alert.alert('Sucesso', 'Todos os dados foram limpos.');
            } catch (error) {
              // Erro já tratado no Alert
              Alert.alert('Erro', 'Não foi possível limpar os dados.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>⚙️ Configurações</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Configure os parâmetros para análise de corridas
          </Text>
        </View>

        {/* Perfis Pré-feitos */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🎯 Perfis Pré-feitos</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Escolha um perfil pronto baseado no seu veículo ou configure manualmente abaixo
          </Text>
          
          {veiculoCadastrado && (
            <View style={styles.veiculoInfoCard}>
              <View style={styles.veiculoInfoHeader}>
                <Text style={styles.veiculoInfoIcon}>
                  {veiculoCadastrado.tipo === 'moto' ? '🏍️' : '🚗'}
                </Text>
                <View style={styles.veiculoInfoContent}>
                  <Text style={styles.veiculoInfoNome}>
                    {veiculoCadastrado.marca} {veiculoCadastrado.modelo}
                  </Text>
                  <Text style={styles.veiculoInfoDetalhes}>
                    {veiculoCadastrado.consumo} km/L • {getTipoVeiculoAtual() === 'moto' ? 'Moto' : 'Carro'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Profile')}
                  style={styles.veiculoInfoButton}
                >
                  <Ionicons name="create-outline" size={18} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.veiculoInfoHint}>
                Perfis filtrados automaticamente baseado no seu veículo cadastrado
              </Text>
            </View>
          )}
          
          {!veiculoCadastrado && getTipoVeiculoAtual() !== 'auto' && (
            <View style={styles.tipoVeiculoInfo}>
              <Ionicons name="information-circle" size={18} color="#3B82F6" />
              <Text style={styles.tipoVeiculoInfoText}>
                Mostrando perfis para: <Text style={styles.tipoVeiculoInfoBold}>
                  {getTipoVeiculoAtual() === 'moto' ? '🏍️ Moto' : '🚗 Carro'}
                </Text>
                {' '}(detectado automaticamente pelo consumo)
              </Text>
            </View>
          )}
          
          {!veiculoCadastrado && getTipoVeiculoAtual() === 'auto' && (
            <TouchableOpacity
              style={[
                styles.cadastrarVeiculoCard,
                {
                  backgroundColor: theme.colors.input,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="car-outline" size={24} color={theme.colors.primary} />
              <View style={styles.cadastrarVeiculoContent}>
                <Text style={[styles.cadastrarVeiculoTitle, { color: theme.colors.text }]}>
                  Cadastre seu veículo no Perfil
                </Text>
                <Text style={[styles.cadastrarVeiculoDesc, { color: theme.colors.textSecondary }]}>
                  Para ver perfis recomendados personalizados
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <View style={styles.perfisPrefeitosContainer}>
            {getPerfisFiltrados().length > 0 ? (
              getPerfisFiltrados().map((perfil) => (
                <TouchableOpacity
                  key={perfil.id}
                  style={[
                    styles.perfilPrefeitoCard,
                    {
                      backgroundColor: theme.colors.input,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => aplicarPerfilPrefeito(perfil)}
                >
                  <View style={styles.perfilPrefeitoHeader}>
                    <Text style={styles.perfilPrefeitoIcon}>{perfil.icon}</Text>
                    <View style={styles.perfilPrefeitoInfo}>
                      <Text style={[styles.perfilPrefeitoLabel, { color: theme.colors.text }]}>{perfil.label}</Text>
                      <Text style={[styles.perfilPrefeitoDesc, { color: theme.colors.textSecondary }]}>{perfil.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                  </View>
                  <View style={[styles.perfilPrefeitoBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="star" size={14} color={theme.colors.primary} />
                    <Text style={[styles.perfilPrefeitoBadgeText, { color: theme.colors.primary }]}>Recomendado</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.perfisVaziosContainer}>
                <Ionicons name="car-outline" size={48} color="#9CA3AF" />
                <Text style={[styles.perfisVaziosText, { color: theme.colors.textSecondary }]}>
                  Configure o consumo do veículo acima para ver perfis recomendados
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Parâmetros Principais do Motor de Decisão */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>⚙️ Configuração Manual</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Configure os parâmetros essenciais para o motor de decisão funcionar
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.text }]}>R$/km Mínimo Aceitável</Text>
            </View>
            <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
              Ex.: R$ 1,80/km, R$ 2,20/km - Usado para saber se a corrida paga bem pela distância
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.input,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="1.80"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.rsPorKmMinimo}
              onChangeText={(text) => setConfig({ ...config, rsPorKmMinimo: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.text }]}>R$/hora Mínimo Desejado</Text>
            </View>
            <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
              Ex.: R$ 25,00/h, R$ 35,00/h - Usado para ver se vale o tempo que você vai "ficar preso" na corrida
            </Text>
            <TextInput
              style={[styles.input, getThemedInputStyle()]}
              placeholder="25.00"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.rsPorHoraMinimo}
              onChangeText={(text) => setConfig({ ...config, rsPorHoraMinimo: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.text }]}>Distância Máxima da Corrida (km)</Text>
            </View>
            <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
              Ex.: até 7 km, até 12 km - Evita corridas longas demais pro seu gosto
            </Text>
            <TextInput
              style={[styles.input, getThemedInputStyle()]}
              placeholder="10"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.distanciaMaxima}
              onChangeText={(text) => setConfig({ ...config, distanciaMaxima: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.text }]}>Tempo Máximo Estimado (minutos)</Text>
            </View>
            <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
              Ex.: até 25 min, até 40 min - Evita corridas que seguram você por muito tempo
            </Text>
            <TextInput
              style={[styles.input, getThemedInputStyle()]}
              placeholder="30"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.tempoMaximoEstimado}
              onChangeText={(text) => setConfig({ ...config, tempoMaximoEstimado: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="speedometer-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.text }]}>Consumo Médio do Veículo (km/L)</Text>
            </View>
            <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
              Ex.: 35 km/L (moto), 12 km/L (carro) - Serve para calcular custo de combustível e detectar tipo de veículo
            </Text>
            <TextInput
              style={[styles.input, getThemedInputStyle()]}
              placeholder="12"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.mediaKmPorLitro}
              onChangeText={(text) => {
                setConfig({ 
                  ...config, 
                  mediaKmPorLitro: text,
                });
              }}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="flash-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.label, { color: theme.colors.text }]}>Preço Médio do Combustível (R$/L)</Text>
            </View>
            <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
              Ex.: R$ 6,00/L - Junto com o consumo, define o custo por km
            </Text>
            <TextInput
              style={[styles.input, getThemedInputStyle()]}
              placeholder="6.00"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.precoCombustivel}
              onChangeText={(text) => setConfig({ ...config, precoCombustivel: text })}
              keyboardType="decimal-pad"
            />
          </View>

        </Card>

        {/* Parâmetros Avançados */}
        <Card>
          <TouchableOpacity
            style={styles.avancadosHeader}
            onPress={() => setShowAvancados(!showAvancados)}
          >
            <View style={styles.avancadosHeaderLeft}>
              <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8, color: theme.colors.text }]}>⚙️ Parâmetros Avançados</Text>
            </View>
            <Ionicons
              name={showAvancados ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {showAvancados && (
            <>
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                Configurações opcionais para ajuste fino do motor de decisão
              </Text>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Distância Máxima até o Cliente (km)</Text>
                </View>
                <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
                  Ex.: até 1,5 km - Para evitar rodar muito "de graça" até o embarque
                </Text>
                <TextInput
                  style={[styles.input, getThemedInputStyle()]}
                  placeholder="1.5"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={config.distanciaMaximaCliente}
                  onChangeText={(text) => setConfig({ ...config, distanciaMaximaCliente: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="apps-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Preferência de Apps</Text>
                </View>
                <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
                  Marque suas preferências - pode influenciar o score final
                </Text>
                {PLATAFORMAS.map((plataforma, index) => {
                  const pref = config.preferenciasApps[plataforma.id] || { preferido: false, evitar: false };
                  const isLast = index === PLATAFORMAS.length - 1;
                  return (
                    <View 
                      key={plataforma.id} 
                      style={[
                        styles.appPreferenceRow,
                        isLast && styles.appPreferenceRowLast
                      ]}
                    >
                      <View style={styles.appPreferenceLeft}>
                        <Ionicons name={plataforma.icon} size={20} color="#6B7280" />
                        <Text style={[styles.appPreferenceLabel, { color: theme.colors.text }]}>{plataforma.label}</Text>
                      </View>
                      <View style={styles.appPreferenceSwitches}>
                        <View style={styles.switchContainer}>
                          <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>Preferir</Text>
                          <Switch
                            value={pref.preferido}
                            onValueChange={(value) => atualizarPreferenciaApp(plataforma.id, 'preferido', value)}
                            trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                            thumbColor={pref.preferido ? '#FFFFFF' : '#9CA3AF'}
                          />
                        </View>
                        <View style={styles.switchContainer}>
                          <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>Evitar</Text>
                          <Switch
                            value={pref.evitar}
                            onValueChange={(value) => atualizarPreferenciaApp(plataforma.id, 'evitar', value)}
                            trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                            thumbColor={pref.evitar ? '#FFFFFF' : '#9CA3AF'}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="trophy-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Meta Diária de Lucro (R$)</Text>
                </View>
                <Text style={[styles.labelHint, { color: theme.colors.textSecondary }]}>
                  Ex.: R$ 200/dia - Ajuda a mostrar progresso e dar alertas
                </Text>
                <TextInput
                  style={[styles.input, getThemedInputStyle()]}
                  placeholder="200.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={config.metaDiariaLucro}
                  onChangeText={(text) => setConfig({ ...config, metaDiariaLucro: text })}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          )}
        </Card>

        {/* Informações */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.infoTitle}>Como funciona?</Text>
          </View>
          <Text style={styles.infoText}>
            Com base nesses parâmetros, o motor de decisão calcula automaticamente se cada
            corrida compensa ou não, levando em conta:
          </Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• R$/km mínimo aceitável - se a corrida paga bem pela distância</Text>
            <Text style={styles.infoItem}>• R$/hora mínimo desejado - se vale o tempo investido</Text>
            <Text style={styles.infoItem}>• Limites de distância e tempo - suas preferências pessoais</Text>
            <Text style={styles.infoItem}>• Custo de combustível - calculado pelo consumo e preço</Text>
            <Text style={styles.infoItem}>• Perfil de trabalho - peso dado para corridas curtas vs longas</Text>
            <Text style={styles.infoItem}>• Preferências de apps - influência no score final</Text>
          </View>
        </Card>

        {/* Botões de Ação */}
        <View style={styles.footer}>
          <Button
            title="💾 Salvar Configurações"
            onPress={salvarConfig}
            loading={saving}
            style={styles.saveButton}
          />

          <Button
            title="🗑️ Limpar Todos os Dados"
            onPress={limparDados}
            variant="outline"
            style={[styles.saveButton, styles.dangerButton]}
            textStyle={{ color: '#EF4444' }}
          />
        </View>

        {/* Aparência */}
        <Card>
          <Text style={styles.sectionTitle}>🌙 Aparência</Text>
          <Text style={styles.sectionDescription}>
            Escolha o tema visual do aplicativo
          </Text>
          <View style={styles.themeContainer}>
            <View style={styles.themeButtons}>
              {[
                { mode: 'light', label: 'Claro', icon: '☀️', desc: 'Tema claro' },
                { mode: 'dark', label: 'Escuro', icon: '🌙', desc: 'Tema escuro' },
                { mode: 'system', label: 'Auto', icon: '🔄', desc: 'Seguir sistema' },
              ].map(({ mode, label, icon, desc }) => {
                const isSelected = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themeButton,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.input,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => toggleTheme(mode)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                      ]}
                    >
                      {icon}
                    </Text>
                    <Text
                      style={[
                        styles.themeButtonLabel,
                        {
                          color: isSelected ? '#FFFFFF' : theme.colors.text,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text
                      style={[
                        styles.themeButtonDesc,
                        {
                          color: isSelected ? '#E9D5FF' : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.themeInfo}>
              <Ionicons 
                name={themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sunny-outline' : 'phone-portrait-outline'} 
                size={18} 
                color={themeMode === 'dark' ? '#A78BFA' : themeMode === 'light' ? '#8B5CF6' : '#6B7280'} 
              />
              <Text style={styles.themeInfoText}>
                {themeMode === 'dark' 
                  ? 'Tema escuro ativado' 
                  : themeMode === 'light' 
                  ? 'Tema claro ativado' 
                  : 'Seguindo preferências do sistema'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.aboutContainer}>
          <Text style={[styles.aboutText, { color: theme.colors.textSecondary }]}>
            DriverFlow v1.0.0{'\n'}
            Gestão Inteligente para Motoristas
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  labelHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    marginLeft: 28,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoList: {
    marginLeft: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
    lineHeight: 20,
  },
  themeContainer: {
    marginTop: 8,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  themeInfoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  themeButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  themeButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  themeButtonLabelActive: {
    color: '#FFFFFF',
  },
  themeButtonDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  themeButtonDescActive: {
    color: '#E9D5FF',
  },
  footer: {
    padding: 20,
    paddingBottom: 16,
  },
  saveButton: {
    width: '100%',
    marginBottom: 12,
  },
  dangerButton: {
    borderColor: '#EF4444',
  },
  aboutContainer: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  perfilContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  perfilButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  perfilButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  perfilIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  perfilLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  perfilLabelActive: {
    color: '#FFFFFF',
  },
  perfilDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  perfilDescActive: {
    color: '#E9D5FF',
  },
  avancadosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avancadosHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appPreferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appPreferenceRowLast: {
    borderBottomWidth: 0,
  },
  appPreferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appPreferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  appPreferenceSwitches: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  switchContainer: {
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  perfisPrefeitosContainer: {
    gap: 12,
    marginTop: 8,
  },
  perfilPrefeitoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  perfilPrefeitoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  perfilPrefeitoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  perfilPrefeitoInfo: {
    flex: 1,
  },
  perfilPrefeitoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  perfilPrefeitoDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  perfilPrefeitoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  perfilPrefeitoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  tipoVeiculoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  tipoVeiculoInfoText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
  },
  tipoVeiculoInfoBold: {
    fontWeight: '600',
  },
  perfisVaziosContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  perfisVaziosText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  veiculoInfoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  veiculoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  veiculoInfoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  veiculoInfoContent: {
    flex: 1,
  },
  veiculoInfoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  veiculoInfoDetalhes: {
    fontSize: 13,
    color: '#3B82F6',
  },
  veiculoInfoButton: {
    padding: 8,
  },
  veiculoInfoHint: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginLeft: 44,
  },
  cadastrarVeiculoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cadastrarVeiculoContent: {
    flex: 1,
    marginLeft: 12,
  },
  cadastrarVeiculoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cadastrarVeiculoDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  tipoDetectadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  tipoDetectadoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  tipoVeiculoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  tipoVeiculoButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tipoVeiculoButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tipoVeiculoButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  tipoVeiculoButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  tipoVeiculoButtonLabelActive: {
    color: '#FFFFFF',
  },
  tipoVeiculoButtonDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  tipoVeiculoButtonDescActive: {
    color: '#E9D5FF',
  },
  veiculoInfoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  veiculoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  veiculoInfoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  veiculoInfoContent: {
    flex: 1,
  },
  veiculoInfoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  veiculoInfoDetalhes: {
    fontSize: 13,
    color: '#3B82F6',
  },
  veiculoInfoButton: {
    padding: 8,
  },
  veiculoInfoHint: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginLeft: 44,
  },
  cadastrarVeiculoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cadastrarVeiculoContent: {
    flex: 1,
    marginLeft: 12,
  },
  cadastrarVeiculoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cadastrarVeiculoDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
});

