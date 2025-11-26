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
  const [tendencias, setTendencias] = useState({
    receitas: { valor: 0, isPositive: true },
    despesas: { valor: 0, isPositive: false },
  });
  const [chartData, setChartData] = useState({
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const stats = await AnaliseService.calcularEstatisticas();
      setEstatisticas(stats);
      
      // Carregar dados reais para o gráfico
      const realChartData = await getChartData();
      setChartData(realChartData);
      
      // Calcular tendências reais
      const tendenciasReais = await calcularTendencias();
      setTendencias(tendenciasReais);
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
    if (estatisticas.lucroLiquido > 0) return '#6BBD9B';
    if (estatisticas.lucroLiquido < 0) return '#EF4444';
    return '#6B7280';
  };

  // Calcula tendências comparando período atual com período anterior
  const calcularTendencias = async () => {
    try {
      const corridas = await StorageService.getCorridas();
      const despesas = await StorageService.getDespesas();
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Período atual: últimos 30 dias
      const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Período anterior: 30 dias antes do período atual (dias 31-60)
      const sessentaDiasAtras = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      // Filtrar corridas e despesas do período atual
      const corridasAtual = corridas.filter(c => {
        const data = new Date(c.createdAt);
        return data >= trintaDiasAtras && data < hoje;
      });
      
      const despesasAtual = despesas.filter(d => {
        const data = new Date(d.createdAt);
        return data >= trintaDiasAtras && data < hoje;
      });
      
      // Filtrar corridas e despesas do período anterior
      const corridasAnterior = corridas.filter(c => {
        const data = new Date(c.createdAt);
        return data >= sessentaDiasAtras && data < trintaDiasAtras;
      });
      
      const despesasAnterior = despesas.filter(d => {
        const data = new Date(d.createdAt);
        return data >= sessentaDiasAtras && data < trintaDiasAtras;
      });
      
      // Calcular totais
      const receitasAtual = corridasAtual.reduce((sum, c) => sum + (c.valor || 0), 0);
      const receitasAnterior = corridasAnterior.reduce((sum, c) => sum + (c.valor || 0), 0);
      
      const despesasAtualTotal = despesasAtual.reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesasAnteriorTotal = despesasAnterior.reduce((sum, d) => sum + (d.valor || 0), 0);
      
      // Calcular variação percentual
      const variacaoReceitas = receitasAnterior > 0
        ? ((receitasAtual - receitasAnterior) / receitasAnterior) * 100
        : receitasAtual > 0 ? 100 : 0; // Se não tinha antes e tem agora, é 100% de aumento
      
      const variacaoDespesas = despesasAnteriorTotal > 0
        ? ((despesasAtualTotal - despesasAnteriorTotal) / despesasAnteriorTotal) * 100
        : despesasAtualTotal > 0 ? 100 : 0;
      
      return {
        receitas: {
          valor: parseFloat(Math.abs(variacaoReceitas).toFixed(1)),
          isPositive: variacaoReceitas >= 0, // Receitas aumentando é positivo
        },
        despesas: {
          valor: parseFloat(Math.abs(variacaoDespesas).toFixed(1)),
          isPositive: variacaoDespesas < 0, // Despesas diminuindo é positivo
        },
      };
    } catch (error) {
      console.error('Erro ao calcular tendências:', error);
      return {
        receitas: { valor: 0, isPositive: true },
        despesas: { valor: 0, isPositive: false },
      };
    }
  };

  // Dados para o gráfico (últimos 7 dias) - DADOS REAIS
  const getChartData = async () => {
    try {
      const corridas = await StorageService.getCorridas();
      
      // Calcular os últimos 7 dias
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // Array para armazenar receitas por dia (últimos 7 dias)
      const receitasPorDia = [0, 0, 0, 0, 0, 0, 0];
      
      // Filtrar corridas dos últimos 7 dias
      const seteDiasAtras = new Date(hoje.getTime() - 6 * 24 * 60 * 60 * 1000);
      const corridasRecentes = corridas.filter(c => {
        const dataCorrida = new Date(c.createdAt);
        dataCorrida.setHours(0, 0, 0, 0);
        return dataCorrida >= seteDiasAtras && dataCorrida <= hoje;
      });
      
      // Agrupar por dia e somar receitas
      corridasRecentes.forEach(corrida => {
        const dataCorrida = new Date(corrida.createdAt);
        dataCorrida.setHours(0, 0, 0, 0);
        
        // Calcular quantos dias atrás foi essa corrida (0 = hoje, 6 = 6 dias atrás)
        const diasAtras = Math.floor((hoje - dataCorrida) / (24 * 60 * 60 * 1000));
        
        // Índice no array (0 = hoje, 6 = 6 dias atrás)
        const indice = 6 - diasAtras;
        
        if (indice >= 0 && indice < 7) {
          receitasPorDia[indice] += corrida.valor || 0;
        }
      });
      
      // Gerar labels dos dias da semana
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const labels = [];
      
      for (let i = 6; i >= 0; i--) {
        const data = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
        const diaSemana = diasSemana[data.getDay()];
        labels.push(diaSemana);
      }
      
      return {
        labels,
        datasets: [
          {
            data: receitasPorDia,
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    } catch (error) {
      console.error('Erro ao calcular dados do gráfico:', error);
      // Retornar dados vazios em caso de erro
      return {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }
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
              <Ionicons name="cash" size={28} color="#6BBD9B" />
            </View>
            <Text style={styles.metricValue}>
              {Formatters.currency(estatisticas.totalReceitas)}
            </Text>
            <Text style={styles.metricLabel}>Receitas</Text>
            <View style={styles.metricTrend}>
              <Ionicons 
                name={tendencias.receitas.isPositive ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={tendencias.receitas.isPositive ? "#6BBD9B" : "#EF4444"} 
              />
              <Text style={[
                styles.metricTrendText,
                !tendencias.receitas.isPositive && styles.metricTrendTextDanger
              ]}>
                {tendencias.receitas.isPositive ? '+' : '-'}{tendencias.receitas.valor}%
              </Text>
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
              <Ionicons 
                name={tendencias.despesas.isPositive ? "arrow-down" : "arrow-up"} 
                size={12} 
                color={tendencias.despesas.isPositive ? "#6BBD9B" : "#EF4444"} 
              />
              <Text style={[
                styles.metricTrendText,
                !tendencias.despesas.isPositive && styles.metricTrendTextDanger
              ]}>
                {tendencias.despesas.isPositive ? '-' : '+'}{tendencias.despesas.valor}%
              </Text>
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
              <Ionicons name="location" size={28} color="#6BBD9B" />
            </View>
            <Text style={styles.metricValue}>
              {Formatters.distance(estatisticas.totalKm)}
            </Text>
            <Text style={styles.metricLabel}>Distância</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="speedometer" size={12} color="#6BBD9B" />
              <Text style={[styles.metricTrendText, styles.metricTrendTextInfo]}>
                Média: {estatisticas.totalCorridas > 0 ? Formatters.distance(estatisticas.totalKm / estatisticas.totalCorridas) : '0 km'}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Card de Insights */}
      <Card>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="analytics-outline" size={20} color="#111827" />
          <Text style={styles.sectionTitle}>Insights</Text>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="time-outline" size={20} color="#6BBD9B" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Melhor Horário</Text>
            <Text style={styles.insightValue}>
              {estatisticas.melhorHorario || 'Sem dados'}
            </Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="phone-portrait-outline" size={20} color="#6BBD9B" />
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
          <Ionicons name="calendar-outline" size={20} color="#6BBD9B" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Corridas Hoje</Text>
            <Text style={styles.insightValue}>{estatisticas.corridasHoje}</Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Ionicons name="stats-chart-outline" size={20} color="#6BBD9B" />
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
          title="Capturar Corrida"
          onPress={() => navigation.getParent()?.navigate('Entrada')}
          icon={<Ionicons name="camera-outline" size={20} color="#FFFFFF" />}
          style={styles.actionButton}
        />
        <Button
          title="Adicionar Despesa"
          onPress={() => navigation.getParent()?.navigate('Saidas')}
          variant="outline"
          icon={<Ionicons name="add-circle-outline" size={20} color="#6BBD9B" />}
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
    shadowColor: '#6BBD9B',
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
    backgroundColor: '#6BBD9B',
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
    borderLeftColor: '#6BBD9B',
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
    borderLeftColor: '#6BBD9B',
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
    color: '#6BBD9B',
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

