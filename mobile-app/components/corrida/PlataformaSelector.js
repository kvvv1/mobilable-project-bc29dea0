import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../Button';

const PLATAFORMAS = [
  { id: 'uber', label: 'UBER', icon: 'car', color: '#000000' },
  { id: '99', label: '99', icon: 'car-sport', color: '#FFC107' },
  { id: 'ifood', label: 'IFOOD', icon: 'restaurant', color: '#EA1D2C' },
];

export default function PlataformaSelector({ selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Plataforma *</Text>
      <View style={styles.plataformaButtons}>
        {PLATAFORMAS.map((plataforma) => {
          const isSelected = selected === plataforma.id;
          return (
            <Button
              key={plataforma.id}
              title={plataforma.label}
              variant={isSelected ? 'primary' : 'secondary'}
              onPress={() => onSelect(plataforma.id)}
              style={[
                styles.plataformaButton,
                isSelected && { backgroundColor: plataforma.color },
              ]}
              textStyle={{ fontSize: 12, fontWeight: 'bold' }}
              icon={
                <Ionicons
                  name={plataforma.icon}
                  size={18}
                  color={isSelected ? '#FFFFFF' : plataforma.color}
                />
              }
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  plataformaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  plataformaButton: {
    flex: 1,
    paddingVertical: 12,
  },
});




