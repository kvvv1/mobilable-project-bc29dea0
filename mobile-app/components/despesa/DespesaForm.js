import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Card from '../Card';
import { Masks } from '../../utils/masks';

export default function DespesaForm({
  valor,
  onValorChange,
  descricao,
  onDescricaoChange,
  tipo,
  errors = {},
}) {
  const getTipoInfo = () => {
    const tipos = {
      combustivel: 'Combustível',
      manutencao: 'Manutenção',
      alimentacao: 'Alimentação',
      estacionamento: 'Estacionamento',
      lavagem: 'Lavagem',
      multa: 'Multa',
      seguro: 'Seguro',
      outros: 'Outros',
    };
    return tipos[tipo] || 'Despesa';
  };

  return (
    <Card>
      <Text style={styles.sectionTitle}>Informações</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Valor (R$) *{' '}
          <Text style={styles.labelInfo}>({getTipoInfo()})</Text>
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
          Descrição *
          {errors.descricao && <Text style={styles.errorText}> - {errors.descricao}</Text>}
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.descricao && styles.inputError]}
          placeholder={`Ex: Abastecimento na Shell - 30 litros`}
          value={descricao}
          onChangeText={onDescricaoChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          💡 Dica: Seja específico para facilitar o controle futuro
        </Text>
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
  labelInfo: {
    fontWeight: '400',
    color: '#6B7280',
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
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
});


