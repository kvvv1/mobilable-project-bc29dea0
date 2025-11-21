import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Formatters } from '../utils/formatters';
// LinearGradient será implementado com View e cores gradientes

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [estatisticas, setEstatisticas] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    totalCorridas: 0,
    totalKm: 0,
    valorMedio: 0,
    melhorHorario: null,
    melhorPlataforma: null,
    corridasHoje: 0,
    margemLucro: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const stats = await AnaliseService.calcularEstatisticas();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listener para recarregar quando voltar da tela
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getLucroColor = () => {
    if (estatisticas.lucroLiquido > 0) return '#10B981';
    if (estatisticas.lucroLiquido < 0) return '#EF4444';
    return '#6B7280';
  };

  // Dados para o gráfico (últimos 7 dias)
  const getChartData = () => {
    // Simulando dados de exemplo
    // Em produção, você pegaria dados reais dos últimos 7 dias
    return {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [
        {
          data: [200, 300, 250, 400, 350, 450, 500],
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Visão geral das suas corridas</Text>
      </View>

      {/* Card de Lucro Líquido com Gradiente */}
      <View style={styles.lucroCardContainer}>
        <View style={[
          styles.lucroCard,
          estatisticas.lucroLiquido >= 0 ? styles.lucroCardPositive : styles.lucroCardNegative
        ]}>
          <View style={styles.lucroHeader}>
            <Ionicons 
              name={estatisticas.lucroLiquido >= 0 ? "trending-up" : "trending-down"} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.lucroLabel}>Lucro Líquido (30 dias)</Text>
          </View>
          <Text style={styles.lucroValue}>
            {Formatters.currency(estatisticas.lucroLiquido)}
          </Text>
          <View style={styles.lucroFooter}>
            <View style={styles.lucroBadge}>
              <Ionicons name="stats-chart" size={16} color="#FFFFFF" />
              <Text style={styles.lucroMargin}>
                Margem: {Formatters.percentage(estatisticas.margemLucro)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Cards de Métricas com Ícones e Cores */}
      <View style={styles.metricsRow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.metricCardWrapper}>
          <Card style={[styles.metricCard, styles.metricCardReceita]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="cash" size={28} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>
              {Formatters.currency(estatisticas.totalReceitas)}
            </Text>
            <Text style={styles.metricLabel}>Receitas</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="arrow-up" size={12} color="#10B981" />
              <Text style={styles.metricTrendText}>+12%</Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.metricCardWrapper}>
          <Card style={[styles.metricCard, styles.metricCardDespesa]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="trending-down" size={28} color="#EF4444" />
            </View>
            <Text style={styles.metricValue}>
              {Formatters.currency(estatisticas.totalDespesas)}
            </Text>
            <Text style={styles.metricLabel}>Despesas</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="arrow-down" size={12} color="#EF4444" />
              <Text style={[styles.metricTrendText, styles.metricTrendTextDanger]}>-5%</Text>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.metricCardWrapper}>
          <Card style={[styles.metricCard, styles.metricCardCorridas]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="car" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.metricValue}>{estatisticas.totalCorridas}</Text>
            <Text style={styles.metricLabel}>Corridas</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="time" size={12} color="#3B82F6" />
              <Text style={[styles.metricTrendText, styles.metricTrendTextInfo]}>
                {estatisticas.corridasHoje} hoje
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.metricCardWrapper}>
          <Card style={[styles.metricCard, styles.metricCardDistancia]}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="location" size={28} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>
              {Formatters.distance(estatisticas.totalKm)}
            </Text>
            <Text style={styles.metricLabel}>Distância</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="speedometer" size={12} color="#10B981" />
              <Text style={[styles.metricTrendText, styles.metricTrendTextInfo]}>
                Média: {estatisticas.totalCorridas > 0 ? Formatters.distance(estatisticas.totalKm / estatisticas.totalCorridas) : '0 km'}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Card de Insights */}
      <Card>
        <Text style={styles.sectionTitle}>📊 Insights</Text>
        <View style={styles.insightItem}>
          <Ionicons name="time-outline" size={20} color="#8B5CF6" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Melhor Horário</Text>
            <Text style={styles.insightValue}>
              {estatisticas.melhorHorario || 'Sem dados'}
            </Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="phone-portrait-outline" size={20} color="#8B5CF6" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Melhor Plataforma</Text>
            <Text style={styles.insightValue}>
              {estatisticas.melhorPlataforma
                ? estatisticas.melhorPlataforma.toUpperCase()
                : 'Sem dados'}
            </Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Corridas Hoje</Text>
            <Text style={styles.insightValue}>{estatisticas.corridasHoje}</Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="stats-chart-outline" size={20} color="#8B5CF6" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Ticket Médio</Text>
            <Text style={styles.insightValue}>
              {Formatters.currency(estatisticas.valorMedio)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Botões de Ação */}
      <View style={styles.actionsContainer}>
        <Button
          title="📸 Capturar Corrida"
          onPress={() => navigation.navigate('CapturarCorrida')}
          icon={<Ionicons name="camera-outline" size={20} color="#FFFFFF" />}
          style={styles.actionButton}
        />
        <Button
          title="💰 Adicionar Despesa"
          onPress={() => navigation.navigate('AdicionarDespesa')}
          variant="outline"
          icon={<Ionicons name="add-circle-outline" size={20} color="#8B5CF6" />}
          style={styles.actionButton}
        />
      </View>
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
    fontSize: 16,
    color: '#6B7280',
  },
  lucroCardContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  lucroCard: {
    padding: 24,
    borderRadius: 20,
  },
  lucroCardPositive: {
    backgroundColor: '#8B5CF6',
  },
  lucroCardNegative: {
    backgroundColor: '#EF4444',
  },
  lucroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lucroLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 8,
    fontWeight: '600',
  },
  lucroValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  lucroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lucroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lucroMargin: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  metricCardWrapper: {
    flex: 1,
  },
  metricCard: {
    alignItems: 'center',
    padding: 20,
    minHeight: 140,
    justifyContent: 'center',
  },
  metricCardReceita: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  metricCardDespesa: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  metricCardCorridas: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  metricCardDistancia: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricTrendText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  metricTrendTextDanger: {
    color: '#EF4444',
  },
  metricTrendTextInfo: {
    color: '#6B7280',
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
});

