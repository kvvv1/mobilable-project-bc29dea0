import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import { HistoryService } from '../../services/historyService';
import { Formatters } from '../../utils/formatters';

const getPlataformaIcon = (plataforma) => {
  switch (plataforma?.toLowerCase()) {
    case '99':
      return <Ionicons name="car-sport" size={20} color="#FFC107" />;
    case 'ifood':
      return <Ionicons name="restaurant" size={20} color="#EA1D2C" />;
    default:
      return <Ionicons name="car" size={20} color="#000000" />;
  }
};

export default function HistoricoRapido({ onSelectCorrida }) {
  const [corridas, setCorridas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorico();
  }, []);

  const loadHistorico = async () => {
    try {
      const data = await HistoryService.getUltimasCorridas(3);
      setCorridas(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || corridas.length === 0) {
    return null;
  }

  return (
    <Card>
      <View style={styles.titleContainer}>
        <Ionicons name="flash-outline" size={18} color="#111827" />
        <Text style={styles.title}>Preencher com Última Corrida</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {corridas.map((corrida) => (
          <TouchableOpacity
            key={corrida.id}
            style={styles.corridaCard}
            onPress={() => onSelectCorrida(corrida)}
            accessibilityRole="button"
            accessibilityLabel={`Preencher com corrida de ${Formatters.currency(corrida.valor)}, plataforma ${corrida.plataforma?.toUpperCase()}`}
            accessibilityHint="Toque duas vezes para preencher o formulário com os dados desta corrida"
          >
            <View style={styles.corridaHeader}>
              {getPlataformaIcon(corrida.plataforma)}
              <Text style={styles.plataforma}>{corrida.plataforma?.toUpperCase()}</Text>
            </View>
            <Text style={styles.valor}>{Formatters.currency(corrida.valor)}</Text>
            <Text style={styles.distancia}>
              {Formatters.distance(corrida.distancia)} • {corrida.tempoEstimado}min
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
        <Text style={styles.hint}>Toque para preencher automaticamente</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    marginHorizontal: -4,
  },
  corridaCard: {
    width: 160,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  corridaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  plataforma: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  valor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  distancia: {
    fontSize: 12,
    color: '#6B7280',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  hint: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
});




