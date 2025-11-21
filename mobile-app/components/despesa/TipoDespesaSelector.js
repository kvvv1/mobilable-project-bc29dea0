import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../Button';
import Card from '../Card';

const TIPOS_DESPESA = [
  { id: 'combustivel', label: '⛽ Combustível', icon: 'car-outline', color: '#F59E0B' },
  { id: 'manutencao', label: '🔧 Manutenção', icon: 'build-outline', color: '#6366F1' },
  { id: 'alimentacao', label: '🍔 Alimentação', icon: 'restaurant-outline', color: '#EC4899' },
  { id: 'estacionamento', label: '🅿️ Estacionamento', icon: 'location-outline', color: '#10B981' },
  { id: 'lavagem', label: '🚿 Lavagem', icon: 'water-outline', color: '#06B6D4' },
  { id: 'multa', label: '📋 Multa', icon: 'document-text-outline', color: '#EF4444' },
  { id: 'seguro', label: '🛡️ Seguro', icon: 'shield-checkmark-outline', color: '#8B5CF6' },
  { id: 'outros', label: '📦 Outros', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

export default function TipoDespesaSelector({ selected, onSelect }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>Tipo de Despesa</Text>
      <View style={styles.tiposGrid}>
        {TIPOS_DESPESA.map((tipo) => {
          const isSelected = selected === tipo.id;
          return (
            <Button
              key={tipo.id}
              title={tipo.label}
              variant={isSelected ? 'primary' : 'secondary'}
              onPress={() => onSelect(tipo.id)}
              style={[
                styles.tipoButton,
                isSelected && { backgroundColor: tipo.color },
              ]}
              icon={
                <Ionicons
                  name={tipo.icon}
                  size={20}
                  color={isSelected ? '#FFFFFF' : tipo.color}
                />
              }
            />
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tiposGrid: {
    gap: 12,
  },
  tipoButton: {
    width: '100%',
  },
});

