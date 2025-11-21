import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Card from '../components/Card';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Formatters } from '../utils/formatters';
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;

export default function RelatoriosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [corridas, setCorridas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('30'); // 7, 30, 90 dias

  const loadData = async () => {
    try {
      const [corridasData, despesasData, statsData] = await Promise.all([
        StorageService.getCorridas(),
        StorageService.getDespesas(),
        AnaliseService.calcularEstatisticas(),
      ]);

      setCorridas(corridasData);
      setDespesas(despesasData);
      setEstatisticas(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, periodo]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCorridasPorPeriodo = () => {
    const dias = parseInt(periodo);
    const dataLimite = moment().subtract(dias, 'days').toDate();

    return corridas.filter((c) => new Date(c.createdAt) >= dataLimite);
  };

  const getDespesasPorPeriodo = () => {
    const dias = parseInt(periodo);
    const dataLimite = moment().subtract(dias, 'days').toDate();

    return despesas.filter((d) => new Date(d.createdAt) >= dataLimite);
  };

  const getDadosGraficoLinha = () => {
    const corridasPeriodo = getCorridasPorPeriodo();
    const dias = parseInt(periodo);

    // Agrupar por dia
    const dadosPorDia = {};
    for (let i = dias - 1; i >= 0; i--) {
      const data = moment().subtract(i, 'days').format('DD/MM');
      dadosPorDia[data] = 0;
    }

    corridasPeriodo.forEach((c) => {
      const data = moment(c.createdAt).format('DD/MM');
      if (dadosPorDia[data] !== undefined) {
        dadosPorDia[data] += c.valor || 0;
      }
    });

    const labels = Object.keys(dadosPorDia).slice(-7); // Últimos 7 dias para exibição
    const values = labels.map((label) => dadosPorDia[label]);

    return {
      labels,
      datasets: [
        {
          data: values,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getDadosGraficoPlataforma = () => {
    const corridasPeriodo = getCorridasPorPeriodo();
    const plataformas = {};

    corridasPeriodo.forEach((c) => {
      const plataforma = c.plataforma || 'outros';
      if (!plataformas[plataforma]) {
        plataformas[plataforma] = 0;
      }
      plataformas[plataforma] += c.valor || 0;
    });

    const labels = Object.keys(plataformas);
    const data = Object.values(plataformas);

    return {
      labels: labels.map((l) => l.toUpperCase()),
      data,
    };
  };

  const getDadosGraficoDespesas = () => {
    const despesasPeriodo = getDespesasPorPeriodo();
    const tipos = {};

    despesasPeriodo.forEach((d) => {
      const tipo = d.tipo || 'outros';
      if (!tipos[tipo]) {
        tipos[tipo] = 0;
      }
      tipos[tipo] += d.valor || 0;
    });

    const labels = Object.keys(tipos);
    const data = Object.values(tipos);

    return {
      labels,
      data,
    };
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#8B5CF6',
    },
  };

  const pieChartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando relatórios...</Text>
      </View>
    );
  }

  const corridasPeriodo = getCorridasPorPeriodo();
  const despesasPeriodo = getDespesasPorPeriodo();
  const dadosLinha = getDadosGraficoLinha();
  const dadosPlataforma = getDadosGraficoPlataforma();
  const dadosDespesas = getDadosGraficoDespesas();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <Text style={styles.title}>📊 Relatórios</Text>

        {/* Seletor de Período */}
        <View style={styles.periodoContainer}>
          {['7', '30', '90'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodoButton,
                periodo === p && styles.periodoButtonActive,
              ]}
              onPress={() => setPeriodo(p)}
            >
              <Text
                style={[
                  styles.periodoButtonText,
                  periodo === p && styles.periodoButtonTextActive,
                ]}
              >
                {p} dias
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resumo */}
      <Card style={styles.resumoCard}>
        <Text style={styles.sectionTitle}>Resumo ({periodo} dias)</Text>
        <View style={styles.resumoGrid}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Corridas</Text>
            <Text style={styles.resumoValue}>{corridasPeriodo.length}</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Receitas</Text>
            <Text style={[styles.resumoValue, styles.resumoValueSuccess]}>
              {Formatters.currency(
                corridasPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
              )}
            </Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Despesas</Text>
            <Text style={[styles.resumoValue, styles.resumoValueDanger]}>
              {Formatters.currency(
                despesasPeriodo.reduce((sum, d) => sum + (d.valor || 0), 0)
              )}
            </Text>
          </View>
        </View>
      </Card>

      {/* Gráfico de Receitas */}
      {dadosLinha.labels.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Receitas Diárias</Text>
          <LineChart
            data={dadosLinha}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>
      )}

      {/* Gráfico de Plataformas */}
      {dadosPlataforma.labels.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Receitas por Plataforma</Text>
          <BarChart
            data={dadosPlataforma}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </Card>
      )}

      {/* Gráfico de Despesas */}
      {dadosDespesas.labels.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Despesas por Tipo</Text>
          <PieChart
            data={dadosDespesas.labels.map((label, index) => ({
              name: label.charAt(0).toUpperCase() + label.slice(1),
              value: dadosDespesas.data[index],
              color: [
                '#8B5CF6',
                '#EF4444',
                '#10B981',
                '#F59E0B',
                '#3B82F6',
                '#EC4899',
                '#6366F1',
                '#14B8A6',
              ][index % 8],
              legendFontColor: '#6B7280',
              legendFontSize: 12,
            }))}
            width={screenWidth - 80}
            height={220}
            chartConfig={pieChartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card>
      )}

      {/* Lista de Corridas Recentes */}
      {corridasPeriodo.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Corridas Recentes</Text>
          {corridasPeriodo.slice(0, 5).map((corrida) => (
            <View key={corrida.id} style={styles.corridaItem}>
              <View style={styles.corridaInfo}>
                <Text style={styles.corridaPlataforma}>
                  {corrida.plataforma?.toUpperCase() || 'OUTROS'}
                </Text>
                <Text style={styles.corridaData}>
                  {moment(corrida.createdAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </View>
              <Text style={styles.corridaValor}>
                {Formatters.currency(corrida.valor || 0)}
              </Text>
            </View>
          ))}
          {corridasPeriodo.length > 5 && (
            <Text style={styles.maisItems}>
              +{corridasPeriodo.length - 5} corridas
            </Text>
          )}
        </Card>
      )}

      {corridasPeriodo.length === 0 && despesasPeriodo.length === 0 && (
        <Card>
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              Nenhum dado disponível para o período selecionado
            </Text>
          </View>
        </Card>
      )}

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
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  periodoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  periodoButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodoButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  periodoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodoButtonTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  resumoCard: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  resumoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumoItem: {
    alignItems: 'center',
  },
  resumoLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  resumoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resumoValueSuccess: {
    color: '#10B981',
  },
  resumoValueDanger: {
    color: '#FEF3C7',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  corridaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  corridaInfo: {
    flex: 1,
  },
  corridaPlataforma: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  corridaData: {
    fontSize: 12,
    color: '#6B7280',
  },
  corridaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  maisItems: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    height: 40,
  },
});

