import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import Button from '../components/Button';
import OverlayService from '../services/overlayService';

export default function OverlayScreen({ navigation }) {
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [hasAccessibilityPermission, setHasAccessibilityPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await OverlayService.getOverlayStatus();
      setHasOverlayPermission(status.hasOverlayPermission);
      setHasAccessibilityPermission(status.hasAccessibilityPermission);
      setOverlayEnabled(status.isRunning);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    }
  };

  const handleToggleOverlay = async (value) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Aviso', 'Overlay só funciona no Android');
      return;
    }

    setLoading(true);
    try {
      if (value) {
        // Verificar permissões antes de ativar
        const hasOverlay = hasOverlayPermission;
        const hasAccessibility = hasAccessibilityPermission;

        if (!hasOverlay || !hasAccessibility) {
          Alert.alert(
            'Permissões Necessárias',
            'Para ativar o overlay, você precisa conceder:\n\n' +
            '• Permissão de Sobreposição (SYSTEM_ALERT_WINDOW)\n' +
            '• Permissão de Acessibilidade\n\n' +
            'Deseja configurar agora?',
            [
              { text: 'Cancelar', onPress: () => setOverlayEnabled(false) },
              {
                text: 'Configurar',
                onPress: async () => {
                  if (!hasOverlay) {
                    await OverlayService.requestOverlayPermission();
                  }
                  if (!hasAccessibility) {
                    await OverlayService.requestAccessibilityPermission();
                  }
                  // Recarregar após conceder permissões
                  setTimeout(checkPermissions, 1000);
                },
              },
            ]
          );
          setOverlayEnabled(false);
          return;
        }

        // Ativar overlay
        const success = await OverlayService.startOverlay();
        setOverlayEnabled(success);
      } else {
        // Desativar overlay
        await OverlayService.stopOverlay();
        setOverlayEnabled(false);
      }
    } catch (error) {
      console.error('Erro ao alternar overlay:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status do overlay.');
      setOverlayEnabled(!value);
    } finally {
      setLoading(false);
    }
  };

  const requestOverlayPermission = async () => {
    setLoading(true);
    try {
      await OverlayService.requestOverlayPermission();
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAccessibilityPermission = async () => {
    setLoading(true);
    try {
      await OverlayService.requestAccessibilityPermission();
      setTimeout(checkPermissions, 1000);
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🚫 Overlay</Text>
          <Text style={styles.subtitle}>
            Funcionalidade disponível apenas no Android
          </Text>
        </View>
        <Card>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={48} color="#6BBD9B" />
            <Text style={styles.infoText}>
              O overlay com acessibilidade só funciona no Android. No iOS, esta
              funcionalidade não é suportada devido às limitações do sistema.
            </Text>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Overlay Inteligente</Text>
        <Text style={styles.subtitle}>
          Como o Gigu - Analise corridas automaticamente
        </Text>
      </View>

      {/* Card Principal */}
      <Card style={styles.mainCard}>
        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Ativar Overlay</Text>
            <Text style={styles.switchDescription}>
              Analise corridas automaticamente enquanto usa apps de corrida
            </Text>
          </View>
          <Switch
            value={overlayEnabled}
            onValueChange={handleToggleOverlay}
            disabled={loading}
            trackColor={{ false: '#E5E7EB', true: '#6BBD9B' }}
            thumbColor={overlayEnabled ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>
      </Card>

      {/* Status das Permissões */}
      <Card>
        <Text style={styles.sectionTitle}>📋 Status das Permissões</Text>

        <View style={styles.permissionItem}>
          <View style={styles.permissionInfo}>
            <Ionicons
              name={hasOverlayPermission ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={hasOverlayPermission ? '#6BBD9B' : '#EF4444'}
            />
            <View style={styles.permissionText}>
              <Text style={styles.permissionLabel}>
                Permissão de Sobreposição
              </Text>
              <Text style={styles.permissionDescription}>
                Permite que o app sobreponha outros aplicativos
              </Text>
            </View>
          </View>
          {!hasOverlayPermission && (
            <Button
              title="Conceder"
              variant="outline"
              onPress={requestOverlayPermission}
              style={styles.permissionButton}
            />
          )}
        </View>

        <View style={styles.permissionItem}>
          <View style={styles.permissionInfo}>
            <Ionicons
              name={
                hasAccessibilityPermission ? 'checkmark-circle' : 'close-circle'
              }
              size={24}
              color={hasAccessibilityPermission ? '#6BBD9B' : '#EF4444'}
            />
            <View style={styles.permissionText}>
              <Text style={styles.permissionLabel}>
                Permissão de Acessibilidade
              </Text>
              <Text style={styles.permissionDescription}>
                Permite ler a tela e detectar ofertas de corrida
              </Text>
            </View>
          </View>
          {!hasAccessibilityPermission && (
            <Button
              title="Conceder"
              variant="outline"
              onPress={requestAccessibilityPermission}
              style={styles.permissionButton}
            />
          )}
        </View>
      </Card>

      {/* Como Funciona */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>ℹ️ Como Funciona</Text>
        <View style={styles.howItWorksList}>
          <View style={styles.howItWorksItem}>
            <Ionicons name="eye-outline" size={20} color="#6BBD9B" />
            <Text style={styles.howItWorksText}>
              O app monitora a tela automaticamente usando AccessibilityService
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Ionicons name="phone-portrait-outline" size={20} color="#6BBD9B" />
            <Text style={styles.howItWorksText}>
              Detecta quando apps de corrida (Uber, 99, iFood) mostram uma proposta
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Ionicons name="document-text-outline" size={20} color="#6BBD9B" />
            <Text style={styles.howItWorksText}>
              Extrai automaticamente valor, distância e tempo estimado
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Ionicons name="speedometer-outline" size={20} color="#6BBD9B" />
            <Text style={styles.howItWorksText}>
              Analisa se a corrida compensa baseado nos seus parâmetros
            </Text>
          </View>
          <View style={styles.howItWorksItem}>
            <Ionicons name="radio-button-on-outline" size={20} color="#6BBD9B" />
            <Text style={styles.howItWorksText}>
              Mostra um semáforo de cores (verde/amarelo/vermelho) no overlay
            </Text>
          </View>
        </View>
      </Card>

      {/* Aviso */}
      <Card style={styles.warningCard}>
        <View style={styles.warningHeader}>
          <Ionicons name="warning-outline" size={24} color="#F59E0B" />
          <Text style={styles.warningTitle}>⚠️ Implementação Nativa Necessária</Text>
        </View>
        <Text style={styles.warningText}>
          Esta funcionalidade requer módulos nativos Android que não funcionam no Expo Go.
          Para implementar completamente:
        </Text>
        <View style={styles.warningList}>
          <Text style={styles.warningItem}>
            1. Fazer eject do Expo ou usar Development Build
          </Text>
          <Text style={styles.warningItem}>
            2. Implementar AccessibilityService nativo
          </Text>
          <Text style={styles.warningItem}>
            3. Implementar OverlayService nativo
          </Text>
          <Text style={styles.warningItem}>
            4. Criar bridge React Native para comunicação
          </Text>
        </View>
        <Text style={styles.warningFooter}>
          Consulte o arquivo android-overlay-guide.md para instruções detalhadas.
        </Text>
      </Card>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 10,
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
  mainCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#6BBD9B',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionText: {
    flex: 1,
    marginLeft: 12,
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  howItWorksList: {
    gap: 12,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  howItWorksText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 12,
    lineHeight: 20,
  },
  warningList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  warningItem: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
    lineHeight: 20,
  },
  warningFooter: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
  },
  infoContainer: {
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  footer: {
    height: 40,
  },
});




