import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import { HistoryService } from '../../services/historyService';
import { Formatters } from '../../utils/formatters';

const TIPOS_ICONS = {
  combustivel: { icon: 'car-outline', color: '#F59E0B' },
  manutencao: { icon: 'build-outline', color: '#6366F1' },
  alimentacao: { icon: 'restaurant-outline', color: '#EC4899' },
  estacionamento: { icon: 'location-outline', color: '#10B981' },
  lavagem: { icon: 'water-outline', color: '#06B6D4' },
  multa: { icon: 'document-text-outline', color: '#EF4444' },
  seguro: { icon: 'shield-checkmark-outline', color: '#8B5CF6' },
  outros: { icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
};

export default function HistoricoRapidoDespesa({ tipo, onSelectDespesa }) {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorico();
  }, [tipo]);

  const loadHistorico = async () => {
    try {
      const data = tipo
        ? await HistoryService.getDespesasSimilares(tipo, 3)
        : await HistoryService.getUltimasDespesas(3);
      setDespesas(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || despesas.length === 0) {
    return null;
  }

  return (
    <Card>
      <View style={styles.titleContainer}>
        <Ionicons name="flash-outline" size={18} color="#111827" />
        <Text style={styles.title}>Preencher com Última Despesa</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {despesas.map((despesa) => {
          const tipoInfo = TIPOS_ICONS[despesa.tipo] || TIPOS_ICONS.outros;
          return (
            <TouchableOpacity
              key={despesa.id}
              style={styles.despesaCard}
              onPress={() => onSelectDespesa(despesa)}
              accessibilityRole="button"
              accessibilityLabel={`Preencher com despesa de ${Formatters.currency(despesa.valor)}`}
              accessibilityHint="Toque duas vezes para preencher o formulário com os dados desta despesa"
            >
              <View style={[styles.iconContainer, { backgroundColor: `${tipoInfo.color}20` }]}>
                <Ionicons name={tipoInfo.icon} size={20} color={tipoInfo.color} />
              </View>
              <Text style={styles.valor}>{Formatters.currency(despesa.valor)}</Text>
              <Text style={styles.descricao} numberOfLines={2}>
                {despesa.descricao}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  despesaCard: {
    width: 160,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  descricao: {
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




