import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import FiltrosAvancados from '../components/FiltrosAvancados';
import { StorageService } from '../services/storage';
import { Formatters } from '../utils/formatters';
import { Masks } from '../utils/masks';
import moment from 'moment';

export default function HistoricoCorridasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [corridas, setCorridas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    loadData();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, filtro, filtrosAvancados, busca]);

  const loadData = async () => {
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
      console.error('Erro ao carregar corridas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      case 'excelente': return '#10B981';
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
      default: return '#8B5CF6';
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Histórico de Corridas</Text>
        <TouchableOpacity onPress={() => setFiltrosModalVisible(true)}>
          <Ionicons name="filter" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Busca Rápida */}
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

      {/* Filtros */}
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
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {corridas.length === 0 ? (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                Nenhuma corrida encontrada
              </Text>
              <Text style={styles.emptySubtext}>
                Comece capturando suas primeiras corridas!
              </Text>
            </View>
          </Card>
        ) : (
          corridas.map((corrida) => (
            <TouchableOpacity
              key={corrida.id}
              activeOpacity={0.7}
              onPress={() => abrirDetalhes(corrida)}
            >
              <Card style={styles.corridaCard}>
                <View style={styles.corridaHeader}>
                  <View style={[
                    styles.plataformaBadge,
                    { backgroundColor: getPlataformaColor(corrida.plataforma) }
                  ]}>
                    <Text style={styles.plataformaText}>
                      {corrida.plataforma?.toUpperCase() || 'OUTROS'}
                    </Text>
                  </View>
                  <Text style={styles.corridaData}>
                    {moment(corrida.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </View>

                <View style={styles.corridaBody}>
                  <View style={styles.corridaValorContainer}>
                    <Text style={styles.corridaValor}>
                      {Formatters.currency(corrida.valor || 0)}
                    </Text>
                    {corrida.analise && (
                      <View style={styles.viabilidadeBadge}>
                        <Ionicons
                          name={getViabilidadeIcon(corrida.analise.viabilidade)}
                          size={16}
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
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text style={styles.corridaInfoText}>
                        {Formatters.distance(corrida.distancia || 0)}
                      </Text>
                    </View>
                    <View style={styles.corridaInfoItem}>
                      <Ionicons name="time" size={16} color="#6B7280" />
                      <Text style={styles.corridaInfoText}>
                        {corrida.tempoEstimado || 0} min
                      </Text>
                    </View>
                  </View>

                  {corrida.origem && (
                    <View style={styles.corridaEndereco}>
                      <Ionicons name="navigate" size={14} color="#9CA3AF" />
                      <Text style={styles.corridaEnderecoText} numberOfLines={1}>
                        {corrida.origem} → {corrida.destino || 'Destino'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.corridaFooter}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => abrirDetalhes(corrida)}
                  >
                    <Ionicons name="eye-outline" size={18} color="#8B5CF6" />
                    <Text style={styles.actionButtonText}>Ver Detalhes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => deletarCorrida(corrida.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                      Excluir
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.footer} />
      </ScrollView>

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
                          { color: corridaSelecionada.analise.lucroLiquido > 0 ? '#10B981' : '#EF4444' }
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
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  buscaContainer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 16,
    color: '#111827',
  },
  filtrosContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filtroButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filtroButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filtroButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  corridaCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
  },
  corridaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plataformaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  plataformaText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  corridaData: {
    fontSize: 12,
    color: '#6B7280',
  },
  corridaBody: {
    marginBottom: 12,
  },
  corridaValorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  corridaValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  viabilidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viabilidadeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  corridaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  corridaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corridaInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  corridaEndereco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  corridaEnderecoText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  corridaFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  actionButtonDanger: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
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
  footer: {
    height: 40,
  },
});

