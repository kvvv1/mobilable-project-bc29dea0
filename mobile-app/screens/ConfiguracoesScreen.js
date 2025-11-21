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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { StorageService } from '../services/storage';
import { Formatters } from '../utils/formatters';

export default function ConfiguracoesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, toggleTheme } = useTheme();
  const [config, setConfig] = useState({
    custoKm: '',
    custoHora: '',
    mediaKmPorLitro: '',
    precoCombustivel: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const configData = await StorageService.getConfig();
      setConfig({
        custoKm: configData.custoKm?.toString() || '0.5',
        custoHora: configData.custoHora?.toString() || '20',
        mediaKmPorLitro: configData.mediaKmPorLitro?.toString() || '12',
        precoCombustivel: configData.precoCombustivel?.toString() || '5.5',
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfig = async () => {
    if (!config.custoKm || !config.custoHora || !config.mediaKmPorLitro || !config.precoCombustivel) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setSaving(true);
    try {
      const configData = {
        custoKm: parseFloat(config.custoKm.replace(',', '.')),
        custoHora: parseFloat(config.custoHora.replace(',', '.')),
        mediaKmPorLitro: parseFloat(config.mediaKmPorLitro.replace(',', '.')),
        precoCombustivel: parseFloat(config.precoCombustivel.replace(',', '.')),
      };

      await StorageService.saveConfig(configData);
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
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
              console.error('Erro ao limpar dados:', error);
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
          <Text style={styles.title}>⚙️ Configurações</Text>
          <Text style={styles.subtitle}>
            Configure os parâmetros para análise de corridas
          </Text>
        </View>

        {/* Modo Escuro */}
        <Card>
          <Text style={styles.sectionTitle}>🌙 Aparência</Text>
          <View style={styles.themeContainer}>
            <View style={styles.themeInfo}>
              <Ionicons name="moon-outline" size={24} color="#8B5CF6" />
              <View style={styles.themeText}>
                <Text style={styles.themeTitle}>Modo Escuro</Text>
                <Text style={styles.themeSubtitle}>
                  {themeMode === 'dark' ? 'Ativado' : themeMode === 'light' ? 'Desativado' : 'Automático'}
                </Text>
              </View>
            </View>
            <View style={styles.themeButtons}>
              {['light', 'dark', 'system'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeButton,
                    themeMode === mode && styles.themeButtonActive,
                  ]}
                  onPress={() => toggleTheme(mode)}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      themeMode === mode && styles.themeButtonTextActive,
                    ]}
                  >
                    {mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '🔄'}
                  </Text>
                  <Text
                    style={[
                      styles.themeButtonLabel,
                      themeMode === mode && styles.themeButtonLabelActive,
                    ]}
                  >
                    {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Auto'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Custos Operacionais</Text>
          <Text style={styles.sectionDescription}>
            Configure os custos para análise precisa de viabilidade
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="car-outline" size={20} color="#8B5CF6" />
              <Text style={styles.label}>Custo por KM (R$)</Text>
            </View>
            <Text style={styles.labelHint}>
              Custo de desgaste do veículo por quilômetro
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0.50"
              value={config.custoKm}
              onChangeText={(text) => setConfig({ ...config, custoKm: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
              <Text style={styles.label}>Custo por Hora (R$)</Text>
            </View>
            <Text style={styles.labelHint}>
              Valor da sua hora trabalhada
            </Text>
            <TextInput
              style={styles.input}
              placeholder="20.00"
              value={config.custoHora}
              onChangeText={(text) => setConfig({ ...config, custoHora: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="speedometer-outline" size={20} color="#8B5CF6" />
              <Text style={styles.label}>Média KM por Litro</Text>
            </View>
            <Text style={styles.labelHint}>
              Consumo médio do seu veículo
            </Text>
            <TextInput
              style={styles.input}
              placeholder="12"
              value={config.mediaKmPorLitro}
              onChangeText={(text) => setConfig({ ...config, mediaKmPorLitro: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="flash-outline" size={20} color="#8B5CF6" />
              <Text style={styles.label}>Preço do Combustível (R$/L)</Text>
            </View>
            <Text style={styles.labelHint}>
              Preço atual do litro de combustível
            </Text>
            <TextInput
              style={styles.input}
              placeholder="5.50"
              value={config.precoCombustivel}
              onChangeText={(text) => setConfig({ ...config, precoCombustivel: text })}
              keyboardType="decimal-pad"
            />
          </View>
        </Card>

        {/* Informações */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.infoTitle}>Como funciona?</Text>
          </View>
          <Text style={styles.infoText}>
            Com base nesses parâmetros, o app calcula automaticamente se cada
            corrida compensa ou não, levando em conta:
          </Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Custo de combustível</Text>
            <Text style={styles.infoItem}>• Desgaste do veículo</Text>
            <Text style={styles.infoItem}>• Valor da sua hora</Text>
            <Text style={styles.infoItem}>• Margem de lucro</Text>
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

        <View style={styles.aboutContainer}>
          <Text style={styles.aboutText}>
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
    marginBottom: 16,
  },
  themeText: {
    marginLeft: 12,
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
});

