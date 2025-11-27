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
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';
import FiltrosAvancados from '../components/FiltrosAvancados';
import { StorageService } from '../services/storage';
import AnaliseService from '../services/analiseCorridas';
import { Formatters } from '../utils/formatters';
import { Masks } from '../utils/masks';
import moment from 'moment';
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
  
  // Estados para histórico de corridas
  const [corridas, setCorridas] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // todas, hoje, semana, mes
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    plataforma: '',
    valorMin: '',
    valorMax: '',
    viabilidade: '',
    busca: '',
  });
  const [filtrosModalVisible, setFiltrosModalVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [corridaSelecionada, setCorridaSelecionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

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
      
      // Carregar histórico de corridas
      await loadHistoricoCorridas();
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadHistoricoCorridas = async () => {
    try {
      const todasCorridas = await StorageService.getCorridas();
      let corridasFiltradas = todasCorridas;

      // Filtro por período
      const agora = moment();
      switch (filtro) {
        case 'hoje':
          corridasFiltradas = corridasFiltradas.filter(c => 
            moment(c.createdAt).isSame(agora, 'day')
          );
          break;
        case 'semana':
          corridasFiltradas = corridasFiltradas.filter(c => 
            moment(c.createdAt).isAfter(agora.subtract(7, 'days'))
          );
          break;
        case 'mes':
          corridasFiltradas = corridasFiltradas.filter(c => 
            moment(c.createdAt).isAfter(agora.subtract(30, 'days'))
          );
          break;
      }

      // Filtros avançados
      if (filtrosAvancados.plataforma) {
        corridasFiltradas = corridasFiltradas.filter(c => 
          c.plataforma?.toLowerCase() === filtrosAvancados.plataforma.toLowerCase()
        );
      }

      if (filtrosAvancados.valorMin) {
        const valorMin = Masks.unformatMoney(filtrosAvancados.valorMin);
        corridasFiltradas = corridasFiltradas.filter(c => c.valor >= valorMin);
      }

      if (filtrosAvancados.valorMax) {
        const valorMax = Masks.unformatMoney(filtrosAvancados.valorMax);
        corridasFiltradas = corridasFiltradas.filter(c => c.valor <= valorMax);
      }

      if (filtrosAvancados.viabilidade) {
        corridasFiltradas = corridasFiltradas.filter(c => 
          c.analise?.viabilidade === filtrosAvancados.viabilidade
        );
      }

      // Busca global
      const buscaTermo = busca.toLowerCase() || filtrosAvancados.busca.toLowerCase();
      if (buscaTermo) {
        corridasFiltradas = corridasFiltradas.filter(c => {
          const origem = (c.origem || '').toLowerCase();
          const destino = (c.destino || '').toLowerCase();
          const plataforma = (c.plataforma || '').toLowerCase();
          const valor = Formatters.currency(c.valor || 0).toLowerCase();
          return origem.includes(buscaTermo) || 
                 destino.includes(buscaTermo) || 
                 plataforma.includes(buscaTermo) ||
                 valor.includes(buscaTermo);
        });
      }

      // Ordenar por data (mais recente primeiro)
      corridasFiltradas.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setCorridas(corridasFiltradas);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listener para recarregar quando voltar da tela
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, filtro, filtrosAvancados, busca]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const deletarCorrida = (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta corrida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteCorrida(id);
            loadData();
          },
        },
      ]
    );
  };

  const abrirDetalhes = (corrida) => {
    setCorridaSelecionada(corrida);
    setModalVisible(true);
  };

  const getViabilidadeColor = (viabilidade) => {
    switch (viabilidade) {
      case 'excelente': return '#6BBD9B';
      case 'boa': return '#22C55E';
      case 'razoavel': return '#EAB308';
      case 'ruim': return '#F97316';
      case 'pessima': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getViabilidadeIcon = (viabilidade) => {
    switch (viabilidade) {
      case 'excelente': return 'checkmark-circle';
      case 'boa': return 'checkmark-circle-outline';
      case 'razoavel': return 'alert-circle-outline';
      case 'ruim': return 'close-circle-outline';
      case 'pessima': return 'close-circle';
      default: return 'help-circle-outline';
    }
  };

  const getPlataformaColor = (plataforma) => {
    switch (plataforma?.toLowerCase()) {
      case 'uber': return '#000000';
      case '99': return '#FFC107';
      case 'ifood': return '#EA1D2C';
      default: return '#6BBD9B';
    }
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

      {/* Seção de Histórico de Corridas */}
      <View style={styles.historicoSection}>
        <Card>
          <TouchableOpacity
            style={styles.historicoHeader}
            onPress={() => setMostrarHistorico(!mostrarHistorico)}
            activeOpacity={0.7}
          >
            <View style={styles.historicoHeaderLeft}>
              <Ionicons name="time-outline" size={24} color="#6BBD9B" />
              <View style={styles.historicoHeaderText}>
                <Text style={styles.historicoTitle}>Histórico de Corridas</Text>
                <Text style={styles.historicoSubtitle}>
                  {corridas.length} {corridas.length === 1 ? 'corrida' : 'corridas'}
                </Text>
              </View>
            </View>
            <Ionicons
              name={mostrarHistorico ? "chevron-up" : "chevron-down"}
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>

          {mostrarHistorico && (
            <>
              {/* Busca e Filtros */}
              <View style={styles.historicoControls}>
                <View style={styles.buscaContainer}>
                  <View style={styles.buscaInputContainer}>
                    <Ionicons name="search" size={20} color="#6B7280" style={styles.buscaIcon} />
                    <TextInput
                      style={styles.buscaInput}
                      placeholder="Buscar corridas..."
                      value={busca}
                      onChangeText={setBusca}
                      placeholderTextColor="#9CA3AF"
                    />
                    {busca ? (
                      <TouchableOpacity onPress={() => setBusca('')}>
                        <Ionicons name="close-circle" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.filtrosContainer}>
                  {[
                    { key: 'todas', label: 'Todas' },
                    { key: 'hoje', label: 'Hoje' },
                    { key: 'semana', label: 'Semana' },
                    { key: 'mes', label: 'Mês' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.filtroButton,
                        filtro === f.key && styles.filtroButtonActive,
                      ]}
                      onPress={() => setFiltro(f.key)}
                    >
                      <Text
                        style={[
                          styles.filtroButtonText,
                          filtro === f.key && styles.filtroButtonTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.filtroButtonIcon}
                    onPress={() => setFiltrosModalVisible(true)}
                  >
                    <Ionicons name="filter" size={18} color="#6BBD9B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lista de Corridas */}
              {corridas.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="car-outline" size={64} color="#9CA3AF" />
                  <Text style={styles.emptyText}>
                    Nenhuma corrida encontrada
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Comece capturando suas primeiras corridas!
                  </Text>
                </View>
              ) : (
                <View style={styles.corridasList}>
                  {corridas.slice(0, 5).map((corrida) => (
                    <TouchableOpacity
                      key={corrida.id}
                      activeOpacity={0.7}
                      onPress={() => abrirDetalhes(corrida)}
                      style={styles.corridaItem}
                    >
                      <View style={styles.corridaItemHeader}>
                        <View style={[
                          styles.plataformaBadge,
                          { backgroundColor: getPlataformaColor(corrida.plataforma) }
                        ]}>
                          <Text style={styles.plataformaText}>
                            {corrida.plataforma?.toUpperCase() || 'OUTROS'}
                          </Text>
                        </View>
                        <Text style={styles.corridaData}>
                          {moment(corrida.createdAt).format('DD/MM HH:mm')}
                        </Text>
                      </View>

                      <View style={styles.corridaItemBody}>
                        <View style={styles.corridaValorContainer}>
                          <Text style={styles.corridaValor}>
                            {Formatters.currency(corrida.valor || 0)}
                          </Text>
                          {corrida.analise && (
                            <View style={styles.viabilidadeBadge}>
                              <Ionicons
                                name={getViabilidadeIcon(corrida.analise.viabilidade)}
                                size={14}
                                color={getViabilidadeColor(corrida.analise.viabilidade)}
                              />
                              <Text
                                style={[
                                  styles.viabilidadeText,
                                  { color: getViabilidadeColor(corrida.analise.viabilidade) }
                                ]}
                              >
                                {corrida.analise.recomendacao.split('!')[0]}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.corridaInfo}>
                          <View style={styles.corridaInfoItem}>
                            <Ionicons name="location" size={14} color="#6B7280" />
                            <Text style={styles.corridaInfoText}>
                              {Formatters.distance(corrida.distancia || 0)}
                            </Text>
                          </View>
                          <View style={styles.corridaInfoItem}>
                            <Ionicons name="time" size={14} color="#6B7280" />
                            <Text style={styles.corridaInfoText}>
                              {corrida.tempoEstimado || 0} min
                            </Text>
                          </View>
                        </View>

                        {corrida.origem && (
                          <View style={styles.corridaEndereco}>
                            <Ionicons name="navigate" size={12} color="#9CA3AF" />
                            <Text style={styles.corridaEnderecoText} numberOfLines={1}>
                              {corrida.origem} → {corrida.destino || 'Destino'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.corridaItemFooter}>
                        <TouchableOpacity
                          style={styles.actionButtonSmall}
                          onPress={() => abrirDetalhes(corrida)}
                        >
                          <Ionicons name="eye-outline" size={16} color="#6BBD9B" />
                          <Text style={styles.actionButtonTextSmall}>Detalhes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButtonSmall, styles.actionButtonDanger]}
                          onPress={() => deletarCorrida(corrida.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {corridas.length > 5 && (
                    <TouchableOpacity
                      style={styles.verMaisButton}
                      onPress={() => {
                        // Aqui você pode expandir para mostrar todas ou navegar para uma tela completa
                        Alert.alert('Info', 'Mostrando as 5 mais recentes. Use os filtros para ver mais.');
                      }}
                    >
                      <Text style={styles.verMaisText}>
                        Ver mais {corridas.length - 5} corridas
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6BBD9B" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </Card>
      </View>

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

      {/* Modal de Detalhes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Corrida</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {corridaSelecionada && (
              <ScrollView style={styles.modalBody}>
                {corridaSelecionada.imagem && (
                  <Image
                    source={{ uri: corridaSelecionada.imagem }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informações Básicas</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Plataforma:</Text>
                    <Text style={styles.modalValue}>
                      {corridaSelecionada.plataforma?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Valor:</Text>
                    <Text style={[styles.modalValue, styles.modalValueBold]}>
                      {Formatters.currency(corridaSelecionada.valor || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Distância:</Text>
                    <Text style={styles.modalValue}>
                      {Formatters.distance(corridaSelecionada.distancia || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Tempo:</Text>
                    <Text style={styles.modalValue}>
                      {corridaSelecionada.tempoEstimado || 0} minutos
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Data:</Text>
                    <Text style={styles.modalValue}>
                      {moment(corridaSelecionada.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </View>
                </View>

                {corridaSelecionada.origem && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Rota</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Origem:</Text>
                      <Text style={styles.modalValue}>{corridaSelecionada.origem}</Text>
                    </View>
                    {corridaSelecionada.destino && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Destino:</Text>
                        <Text style={styles.modalValue}>{corridaSelecionada.destino}</Text>
                      </View>
                    )}
                  </View>
                )}

                {corridaSelecionada.analise && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Análise de Viabilidade</Text>
                    <View style={[
                      styles.modalAnaliseCard,
                      { borderLeftColor: getViabilidadeColor(corridaSelecionada.analise.viabilidade) }
                    ]}>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Recomendação:</Text>
                        <Text style={[
                          styles.modalValue,
                          { color: getViabilidadeColor(corridaSelecionada.analise.viabilidade) }
                        ]}>
                          {corridaSelecionada.analise.recomendacao}
                        </Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Lucro Líquido:</Text>
                        <Text style={[
                          styles.modalValue,
                          { color: corridaSelecionada.analise.lucroLiquido > 0 ? '#6BBD9B' : '#EF4444' }
                        ]}>
                          {Formatters.currency(corridaSelecionada.analise.lucroLiquido)}
                        </Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Margem:</Text>
                        <Text style={styles.modalValue}>
                          {Formatters.percentage(corridaSelecionada.analise.margemLucro)}
                        </Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Custo Total:</Text>
                        <Text style={styles.modalValue}>
                          {Formatters.currency(corridaSelecionada.analise.custoTotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FiltrosAvancados
        visible={filtrosModalVisible}
        onClose={() => setFiltrosModalVisible(false)}
        onApply={(filtros) => {
          setFiltrosAvancados(filtros);
        }}
        filtros={filtrosAvancados}
      />
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
  historicoSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  historicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historicoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historicoHeaderText: {
    gap: 2,
  },
  historicoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  historicoSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  historicoControls: {
    marginTop: 16,
    gap: 12,
  },
  buscaContainer: {
    marginBottom: 8,
  },
  buscaInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  buscaIcon: {
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  filtrosContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filtroButtonActive: {
    backgroundColor: '#6BBD9B',
  },
  filtroButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filtroButtonTextActive: {
    color: '#FFFFFF',
  },
  filtroButtonIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  corridasList: {
    marginTop: 12,
    gap: 12,
  },
  corridaItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  corridaItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plataformaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  plataformaText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  corridaData: {
    fontSize: 11,
    color: '#6B7280',
  },
  corridaItemBody: {
    marginBottom: 12,
  },
  corridaValorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  corridaValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6BBD9B',
  },
  viabilidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  viabilidadeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  corridaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  corridaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  corridaInfoText: {
    fontSize: 12,
    color: '#6B7280',
  },
  corridaEndereco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  corridaEnderecoText: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  corridaItemFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDanger: {
    flex: 0,
    paddingHorizontal: 12,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  actionButtonTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6BBD9B',
  },
  verMaisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  verMaisText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6BBD9B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  modalValueBold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalAnaliseCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginTop: 8,
  },
});

