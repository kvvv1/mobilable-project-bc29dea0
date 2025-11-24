import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Card from '../Card';
import PlataformaSelector from './PlataformaSelector';
import { Masks } from '../../utils/masks';

export default function CorridaForm({
  plataforma,
  onPlataformaChange,
  valor,
  onValorChange,
  distancia,
  onDistanciaChange,
  tempoEstimado,
  onTempoEstimadoChange,
  origem,
  onOrigemChange,
  destino,
  onDestinoChange,
  errors = {},
}) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>Informações da Corrida</Text>

      <PlataformaSelector selected={plataforma} onSelect={onPlataformaChange} />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Valor (R$) *
          {errors.valor && <Text style={styles.errorText}> - {errors.valor}</Text>}
        </Text>
        <TextInput
          style={[styles.input, errors.valor && styles.inputError]}
          placeholder="0,00"
          value={valor}
          onChangeText={(text) => {
            const formatted = Masks.money(text);
            onValorChange(formatted);
          }}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Distância (km) *
          {errors.distancia && <Text style={styles.errorText}> - {errors.distancia}</Text>}
        </Text>
        <TextInput
          style={[styles.input, errors.distancia && styles.inputError]}
          placeholder="0,0"
          value={distancia}
          onChangeText={(text) => {
            const formatted = Masks.decimal(text, 1);
            onDistanciaChange(formatted);
          }}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Tempo Estimado (min) *
          {errors.tempoEstimado && <Text style={styles.errorText}> - {errors.tempoEstimado}</Text>}
        </Text>
        <TextInput
          style={[styles.input, errors.tempoEstimado && styles.inputError]}
          placeholder="0"
          value={tempoEstimado}
          onChangeText={onTempoEstimadoChange}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Origem (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Endereço de origem"
          value={origem}
          onChangeText={onOrigemChange}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Destino (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Endereço de destino"
          value={destino}
          onChangeText={onDestinoChange}
        />
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
});


