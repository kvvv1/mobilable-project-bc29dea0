import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import { Formatters } from '../../utils/formatters';
import { Masks } from '../../utils/masks';

const TIPOS_INFO = {
  combustivel: { label: 'Combustível', icon: 'car-outline', color: '#F59E0B' },
  manutencao: { label: 'Manutenção', icon: 'build-outline', color: '#6366F1' },
  alimentacao: { label: 'Alimentação', icon: 'restaurant-outline', color: '#EC4899' },
  estacionamento: { label: 'Estacionamento', icon: 'location-outline', color: '#6BBD9B' },
  lavagem: { label: 'Lavagem', icon: 'water-outline', color: '#06B6D4' },
  multa: { label: 'Multa', icon: 'document-text-outline', color: '#EF4444' },
  seguro: { label: 'Seguro', icon: 'shield-checkmark-outline', color: '#6BBD9B' },
  outros: { label: 'Outros', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
};

export default function DespesaPreview({ tipo, valor, descricao }) {
  if (!valor) return null;

  const tipoInfo = TIPOS_INFO[tipo] || TIPOS_INFO.outros;
  const valorNumero = Masks.unformatMoney(valor);

  return (
    <Card style={styles.previewCard}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${tipoInfo.color}20` }]}>
          <Ionicons name={tipoInfo.icon} size={24} color={tipoInfo.color} />
        </View>
        <Text style={styles.previewTitle}>Resumo da Despesa</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tipo:</Text>
          <View style={styles.detailValueContainer}>
            <Ionicons name={tipoInfo.icon} size={16} color={tipoInfo.color} />
            <Text style={[styles.detailValue, { color: tipoInfo.color }]}>
              {tipoInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valor:</Text>
          <Text style={[styles.detailValue, styles.detailValueBold]}>
            {Formatters.currency(valorNumero)}
          </Text>
        </View>

        {descricao && (
          <View style={styles.descricaoContainer}>
            <Text style={styles.descricaoLabel}>Descrição:</Text>
            <Text style={styles.descricaoText}>{descricao}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  detailValueBold: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
  },
  descricaoContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  descricaoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  descricaoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});




