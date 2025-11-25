import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Formatters } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/authService';
import PerfilTrabalhoSelector from '../components/PerfilTrabalhoSelector';


export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState({
    name: 'Motorista',
    email: 'driverflow@exemplo.com',
  });
  const [estatisticas, setEstatisticas] = useState({
    totalCorridas: 0,
    totalReceitas: 0,
    totalKm: 0,
    tempoTotal: 0,
    melhorDia: null,
  });
  const [loading, setLoading] = useState(true);
  const [veiculo, setVeiculo] = useState({
    id: null,
    tipo: 'auto',
    marca: '',
    modelo: '',
    ano: '',
    consumo: '',
    personalizado: false,
  });
  const [showOpcoesVeiculo, setShowOpcoesVeiculo] = useState(false);
  const [perfilTrabalho, setPerfilTrabalho] = useState('misto');

  useEffect(() => {
    loadUserProfile();
    loadData();
    loadVeiculo();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserProfile();
      loadData();
      loadVeiculo();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Buscar perfil do usuário no Supabase
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setUserProfile({
          name: profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Motorista',
          email: profile.email || user.email || 'driverflow@exemplo.com',
        });
      } else {
        // Se não encontrar no perfil, usar dados do auth
        setUserProfile({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Motorista',
          email: user.email || 'driverflow@exemplo.com',
        });
      }
    } catch (error) {
      // Em caso de erro, usar dados do auth
      if (user) {
        setUserProfile({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Motorista',
          email: user.email || 'driverflow@exemplo.com',
        });
      }
    }
  };

  const loadData = async () => {
    try {
      const stats = await AnaliseService.calcularEstatisticas();
      const corridas = await StorageService.getCorridas();
      
      // Calcular tempo total
      const tempoTotal = corridas.reduce((sum, c) => sum + (c.tempoEstimado || 0), 0);
      
      // Encontrar melhor dia
      const dias = {};
      corridas.forEach(c => {
        const dia = new Date(c.createdAt).toLocaleDateString('pt-BR', { weekday: 'long' });
        if (!dias[dia]) dias[dia] = 0;
        dias[dia] += c.valor || 0;
      });
      
      const melhorDia = Object.entries(dias).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      setEstatisticas({
        ...stats,
        totalKm: stats.totalKm,
        tempoTotal,
        melhorDia,
      });
    } catch (error) {
      // Erro silenciado - dados opcionais
    } finally {
      setLoading(false);
    }
  };

  const loadVeiculo = async () => {
    try {
      // Primeiro tentar carregar do Supabase
      let veiculoData = null;
      
      if (user?.id) {
        // Buscar organization_id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('current_organization_id')
          .eq('id', user.id)
          .single();

        if (profile?.current_organization_id) {
          // Buscar veículo ativo do usuário
          const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('organization_id', profile.current_organization_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!vehiclesError && vehicles) {
            veiculoData = {
              id: vehicles.id,
              tipo: vehicles.tipo,
              marca: vehicles.marca,
              modelo: vehicles.modelo,
              ano: vehicles.ano || '',
              consumo: vehicles.consumo_medio?.toString() || '',
              personalizado: vehicles.personalizado || false,
            };
          }
        }
      }

      // Se não encontrou no Supabase, carregar do local
      if (!veiculoData) {
        const configData = await StorageService.getConfig();
        veiculoData = configData.veiculo || {};
      }
      
      if (veiculoData?.modelo) {
        setVeiculo({
          id: veiculoData.id || null,
          tipo: veiculoData.tipo || 'auto',
          marca: veiculoData.marca || '',
          modelo: veiculoData.modelo || '',
          ano: veiculoData.ano || '',
          consumo: veiculoData.consumo?.toString() || '',
          personalizado: veiculoData.personalizado || false,
        });
      }
      
      // Carregar perfil de trabalho
      const configData = await StorageService.getConfig();
      setPerfilTrabalho(configData.perfilTrabalho || 'misto');
    } catch (error) {
      // Em caso de erro, tentar carregar do local
      try {
        const configData = await StorageService.getConfig();
        const veiculoData = configData.veiculo || {};
        
        if (veiculoData.modelo) {
          setVeiculo({
            id: veiculoData.id || null,
            tipo: veiculoData.tipo || 'auto',
            marca: veiculoData.marca || '',
            modelo: veiculoData.modelo || '',
            ano: veiculoData.ano || '',
            consumo: veiculoData.consumo?.toString() || '',
            personalizado: veiculoData.personalizado || false,
          });
        }
        
        setPerfilTrabalho(configData.perfilTrabalho || 'misto');
      } catch (localError) {
        // Erro silenciado - veículo opcional
        console.warn('Erro ao carregar veículo:', localError);
      }
    }
  };

  const salvarPerfilTrabalho = async (novoPerfil) => {
    try {
      const configData = await StorageService.getConfig();
      await StorageService.saveConfig({
        ...configData,
        perfilTrabalho: novoPerfil,
      });
      setPerfilTrabalho(novoPerfil);
      Alert.alert('Sucesso', 'Perfil de trabalho atualizado!');
    } catch (error) {
      // Erro já tratado no Alert
      Alert.alert('Erro', 'Não foi possível salvar o perfil de trabalho.');
    }
  };


  const exportarDados = () => {
    navigation.navigate('EnviarDados');
  };

  const compartilharApp = () => {
    Alert.alert(
      'Compartilhar App',
      'Funcionalidade em desenvolvimento.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header com Avatar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#8B5CF6" />
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{userProfile.name}</Text>
        <Text style={styles.userEmail}>{userProfile.email}</Text>
      </View>

      {/* Estatísticas Rápidas */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{estatisticas.totalCorridas}</Text>
          <Text style={styles.statLabel}>Corridas Totais</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#10B981" />
          <Text style={styles.statValue}>
            {Formatters.currency(estatisticas.totalReceitas)}
          </Text>
          <Text style={styles.statLabel}>Ganhos Totais</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="location" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>
            {Formatters.distance(estatisticas.totalKm)}
          </Text>
          <Text style={styles.statLabel}>Distância Total</Text>
        </Card>
      </View>

      {/* Informações Detalhadas */}
      <Card>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="analytics-outline" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Estatísticas Detalhadas</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#8B5CF6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tempo Total</Text>
              <Text style={styles.infoValue}>
                {Math.floor(estatisticas.tempoTotal / 60)}h {estatisticas.tempoTotal % 60}min
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Melhor Dia</Text>
              <Text style={styles.infoValue}>
                {estatisticas.melhorDia ? estatisticas.melhorDia.charAt(0).toUpperCase() + estatisticas.melhorDia.slice(1) : 'Sem dados'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="stats-chart-outline" size={20} color="#8B5CF6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ticket Médio</Text>
              <Text style={styles.infoValue}>
                {Formatters.currency(estatisticas.valorMedio || 0)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="flash-outline" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('HistoricoCorridas')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="list" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Histórico Completo</Text>
            <Text style={styles.actionSubtitle}>Ver todas as corridas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Metas')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="flag" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Metas e Objetivos</Text>
            <Text style={styles.actionSubtitle}>Acompanhe suas metas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={exportarDados}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="download-outline" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Exportar Dados</Text>
            <Text style={styles.actionSubtitle}>PDF ou CSV</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Card>

      {/* Meu Veículo */}
      <Card>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="car-outline" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Meu Veículo</Text>
        </View>
        
        {veiculo.modelo ? (
          <View style={styles.veiculoCard}>
            <View style={styles.veiculoInfo}>
              <View style={styles.veiculoIconContainer}>
                <Ionicons
                  name={veiculo.tipo === 'moto' ? 'bicycle-outline' : 'car-outline'}
                  size={40}
                  color="#111827"
                />
              </View>
              <View style={styles.veiculoDetails}>
                <Text style={styles.veiculoNome}>
                  {veiculo.marca} {veiculo.modelo}
                </Text>
                {veiculo.ano && (
                  <Text style={styles.veiculoAno}>Ano: {veiculo.ano}</Text>
                )}
                <Text style={styles.veiculoConsumo}>
                  Consumo: {veiculo.consumo} km/L
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.veiculoEditar}
              onPress={() => setShowOpcoesVeiculo(true)}
            >
              <Ionicons name="create-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.veiculoAdicionar}
            onPress={() => setShowOpcoesVeiculo(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#8B5CF6" />
            <Text style={styles.veiculoAdicionarText}>Adicionar Veículo</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Perfil de Trabalho */}
      <PerfilTrabalhoSelector selected={perfilTrabalho} onSelect={salvarPerfilTrabalho} />

      {/* Configurações */}
      <Card>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="settings-outline" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Configurações</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('Configuracoes')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Configurações do App</Text>
            <Text style={styles.actionSubtitle}>Parâmetros e preferências</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={compartilharApp}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="share-social-outline" size={24} color="#6B7280" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Compartilhar App</Text>
            <Text style={styles.actionSubtitle}>Indique para outros motoristas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#6B7280" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Política de Privacidade</Text>
            <Text style={styles.actionSubtitle}>Como protegemos seus dados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Card>

      {/* Sobre */}
      <Card style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>DriverFlow</Text>
        <Text style={styles.aboutVersion}>Versão 1.0.0</Text>
        <Text style={styles.aboutDescription}>
          Gestão Inteligente para Motoristas{'\n'}
          Desenvolvido com ❤️ para motoristas de aplicativos
        </Text>
      </Card>

      <View style={styles.footer} />

      {/* Modal de Opções de Veículo */}
      <Modal
        visible={showOpcoesVeiculo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOpcoesVeiculo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalOpcoesContent}>
            <View style={styles.modalOpcoesHeader}>
              <Text style={styles.modalOpcoesTitle}>Adicionar Veículo</Text>
              <TouchableOpacity
                onPress={() => setShowOpcoesVeiculo(false)}
                style={styles.modalOpcoesClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalOpcoesSubtitle}>
              Escolha como deseja adicionar seu veículo
            </Text>

            <TouchableOpacity
              style={styles.opcaoButton}
              onPress={() => {
                setShowOpcoesVeiculo(false);
                navigation.navigate('SelecionarVeiculo');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.opcaoIconContainer}>
                <Ionicons name="list" size={32} color="#8B5CF6" />
              </View>
              <View style={styles.opcaoContent}>
                <Text style={styles.opcaoTitle}>Selecione por Modelo</Text>
                <Text style={styles.opcaoDesc}>
                  Escolha de uma lista de veículos populares
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opcaoButton}
              onPress={() => {
                setShowOpcoesVeiculo(false);
                navigation.navigate('CadastrarVeiculo');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.opcaoIconContainer}>
                <Ionicons name="create-outline" size={32} color="#10B981" />
              </View>
              <View style={styles.opcaoContent}>
                <Text style={styles.opcaoTitle}>Cadastrar Veículo Personalizado</Text>
                <Text style={styles.opcaoDesc}>
                  Preencha manualmente as informações do seu veículo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    alignItems: 'center',
    padding: 32,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    minHeight: 120,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  aboutCard: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    height: 40,
  },
  veiculoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  veiculoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  veiculoIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  veiculoDetails: {
    flex: 1,
  },
  veiculoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  veiculoAno: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  veiculoConsumo: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  veiculoEditar: {
    padding: 8,
  },
  veiculoAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  veiculoAdicionarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOpcoesContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '85%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOpcoesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalOpcoesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalOpcoesClose: {
    padding: 4,
  },
  modalOpcoesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  opcaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  opcaoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  opcaoContent: {
    flex: 1,
  },
  opcaoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  opcaoDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
});
