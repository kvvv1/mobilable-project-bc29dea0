import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Formatters } from '../utils/formatters';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [estatisticas, setEstatisticas] = useState({
    totalCorridas: 0,
    totalReceitas: 0,
    totalKm: 0,
    tempoTotal: 0,
    melhorDia: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

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
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarDados = () => {
    Alert.alert(
      'Exportar Dados',
      'Funcionalidade em desenvolvimento. Em breve você poderá exportar seus dados em PDF ou CSV.',
      [{ text: 'OK' }]
    );
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
        <Text style={styles.userName}>Motorista</Text>
        <Text style={styles.userEmail}>driverflow@exemplo.com</Text>
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
        <Text style={styles.sectionTitle}>📊 Estatísticas Detalhadas</Text>
        
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
        <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
        
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
            <Ionicons name="flag" size={24} color="#10B981" />
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
            <Ionicons name="download-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Exportar Dados</Text>
            <Text style={styles.actionSubtitle}>PDF ou CSV</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Card>

      {/* Configurações */}
      <Card>
        <Text style={styles.sectionTitle}>⚙️ Configurações</Text>
        
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
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
});
