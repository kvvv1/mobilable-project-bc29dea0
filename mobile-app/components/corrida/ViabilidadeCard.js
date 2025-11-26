import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import { Formatters } from '../../utils/formatters';

const VIABILIDADE_CONFIG = {
  excelente: {
    color: '#6BBD9B',
    icon: 'checkmark-circle',
    label: 'Excelente',
  },
  boa: {
    color: '#22C55E',
    icon: 'checkmark-circle-outline',
    label: 'Boa',
  },
  razoavel: {
    color: '#EAB308',
    icon: 'alert-circle-outline',
    label: 'Razoável',
  },
  ruim: {
    color: '#F97316',
    icon: 'close-circle-outline',
    label: 'Ruim',
  },
  pessima: {
    color: '#EF4444',
    icon: 'close-circle',
    label: 'Péssima',
  },
};

export default function ViabilidadeCard({ analise }) {
  if (!analise) return null;

  const config = VIABILIDADE_CONFIG[analise.viabilidade] || VIABILIDADE_CONFIG.razoavel;

  return (
    <Card style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Ionicons name={config.icon} size={24} color={config.color} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: config.color }]}>
            {analise.recomendacao}
          </Text>
          <Text style={styles.subtitle}>Viabilidade: {config.label}</Text>
        </View>
      </View>

      {analise.score !== undefined && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  width: `${analise.score}%`,
                  backgroundColor: config.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.scoreText, { color: config.color }]}>
            Score: {analise.score.toFixed(0)}/100
          </Text>
        </View>
      )}

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Lucro Líquido</Text>
          </View>
          <Text
            style={[
              styles.detailValue,
              {
                color: analise.lucroLiquido > 0 ? '#6BBD9B' : '#EF4444',
                fontWeight: 'bold',
              },
            ]}
          >
            {Formatters.currency(analise.lucroLiquido)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="trending-up-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Margem</Text>
          </View>
          <Text style={styles.detailValue}>
            {Formatters.percentage(analise.margemLucro)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Valor/km</Text>
          </View>
          <View style={styles.detailValueContainer}>
            <Text style={styles.detailValue}>
              {Formatters.currency(analise.valorPorKm)}
            </Text>
            {analise.atendeRsPorKm !== undefined && (
              <Ionicons
                name={analise.atendeRsPorKm ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={analise.atendeRsPorKm ? '#6BBD9B' : '#EF4444'}
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Valor/hora</Text>
          </View>
          <View style={styles.detailValueContainer}>
            <Text style={styles.detailValue}>
              {Formatters.currency(analise.valorPorHora)}
            </Text>
            {analise.atendeRsPorHora !== undefined && (
              <Ionicons
                name={analise.atendeRsPorHora ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={analise.atendeRsPorHora ? '#6BBD9B' : '#EF4444'}
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calculator-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Custo Total</Text>
          </View>
          <Text style={styles.detailValue}>
            {Formatters.currency(analise.custoTotal)}
          </Text>
        </View>

        {/* Alertas de limites */}
        {(analise.excedeDistanciaMaxima || analise.excedeTempoMaximo || analise.excedeDistanciaCliente) && (
          <View style={styles.alertContainer}>
            <Ionicons name="warning-outline" size={18} color="#F97316" />
            <View style={styles.alertTextContainer}>
              {analise.excedeDistanciaMaxima && (
                <Text style={styles.alertText}>⚠️ Distância excede o máximo configurado</Text>
              )}
              {analise.excedeTempoMaximo && (
                <Text style={styles.alertText}>⚠️ Tempo excede o máximo configurado</Text>
              )}
              {analise.excedeDistanciaCliente && (
                <Text style={styles.alertText}>⚠️ Distância até cliente excede o máximo</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    marginLeft: 4,
  },
  scoreContainer: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 8,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
});

