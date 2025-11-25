import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { ZapiService } from '../services/zapiService';
import { StorageService } from '../services/storage';
import { useTheme } from '../contexts/ThemeContext';

export default function EnviarDadosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    instanceId: '',
    token: '',
    phoneNumber: '',
  });
  const [tipo, setTipo] = useState('todos'); // 'corridas', 'despesas', 'todos'
  const [formato, setFormato] = useState('texto'); // 'texto', 'csv'
  const [periodo, setPeriodo] = useState('mes'); // 'hoje', 'semana', 'mes'

  React.useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await StorageService.getConfig();
      if (savedConfig.zapiConfig) {
        setConfig(savedConfig.zapiConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const saveConfig = async () => {
    try {
      const currentConfig = await StorageService.getConfig();
      await StorageService.saveConfig({
        ...currentConfig,
        zapiConfig: config,
      });
      Alert.alert('Sucesso', 'Configuração salva!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração.');
    }
  };

  const handleSend = async () => {
    // Validar configuração
    const validation = ZapiService.validateConfig(config);
    if (!validation.valid) {
      Alert.alert('Configuração Inválida', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const result = await ZapiService.sendDataToWhatsApp(
        config,
        tipo,
        formato,
        periodo
      );

      if (result.success) {
        Alert.alert(
          'Sucesso!',
          'Dados enviados via WhatsApp com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível enviar os dados.');
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Enviar via WhatsApp
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Configuração Z-API */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Configuração Z-API
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Configure suas credenciais do Z-API para enviar dados via WhatsApp
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Instance ID *
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
              placeholder="Ex: 3C7XXXXXXX"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.instanceId}
              onChangeText={(text) => setConfig({ ...config, instanceId: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Token *
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
              placeholder="Seu token do Z-API"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.token}
              onChangeText={(text) => setConfig({ ...config, token: text })}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Número do WhatsApp *
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
              placeholder="5511999999999"
              placeholderTextColor={theme.colors.textSecondary}
              value={config.phoneNumber}
              onChangeText={(text) => setConfig({ ...config, phoneNumber: text })}
              keyboardType="phone-pad"
            />
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Formato: DDI + DDD + Número (sem espaços ou caracteres especiais)
            </Text>
          </View>

          <Button
            title="Salvar Configuração"
            onPress={saveConfig}
            variant="outline"
            style={styles.saveButton}
          />
        </Card>

        {/* Opções de Envio */}
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📤 Opções de Envio
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Tipo de Dados
            </Text>
            <View style={styles.optionsRow}>
              {['todos', 'corridas', 'despesas'].map((opcao) => (
                <TouchableOpacity
                  key={opcao}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: tipo === opcao ? theme.colors.primary : theme.colors.input,
                      borderColor: tipo === opcao ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setTipo(opcao)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      {
                        color: tipo === opcao ? '#FFFFFF' : theme.colors.text,
                      },
                    ]}
                  >
                    {opcao === 'todos' ? 'Todos' : opcao === 'corridas' ? 'Corridas' : 'Despesas'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Formato
            </Text>
            <View style={styles.optionsRow}>
              {['texto', 'csv'].map((opcao) => (
                <TouchableOpacity
                  key={opcao}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: formato === opcao ? theme.colors.primary : theme.colors.input,
                      borderColor: formato === opcao ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setFormato(opcao)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      {
                        color: formato === opcao ? '#FFFFFF' : theme.colors.text,
                      },
                    ]}
                  >
                    {opcao === 'texto' ? 'Texto' : 'CSV'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Período
            </Text>
            <View style={styles.optionsRow}>
              {['hoje', 'semana', 'mes'].map((opcao) => (
                <TouchableOpacity
                  key={opcao}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: periodo === opcao ? theme.colors.primary : theme.colors.input,
                      borderColor: periodo === opcao ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setPeriodo(opcao)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      {
                        color: periodo === opcao ? '#FFFFFF' : theme.colors.text,
                      },
                    ]}
                  >
                    {opcao === 'hoje' ? 'Hoje' : opcao === 'semana' ? 'Semana' : 'Mês'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Botão de Envio */}
        <View style={styles.footer}>
          <Button
            title={loading ? 'Enviando...' : 'Enviar via WhatsApp'}
            onPress={handleSend}
            disabled={loading}
            loading={loading}
            style={styles.sendButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
  },
  sendButton: {
    width: '100%',
  },
});




