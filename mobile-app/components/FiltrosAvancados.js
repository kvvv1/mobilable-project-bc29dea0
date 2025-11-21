import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Button from './Button';

export default function FiltrosAvancados({ visible, onClose, onApply, filtros }) {
  const [localFiltros, setLocalFiltros] = useState(filtros || {
    plataforma: '',
    valorMin: '',
    valorMax: '',
    viabilidade: '',
    busca: '',
  });

  const handleApply = () => {
    onApply(localFiltros);
    onClose();
  };

  const handleReset = () => {
    const reset = {
      plataforma: '',
      valorMin: '',
      valorMax: '',
      viabilidade: '',
      busca: '',
    };
    setLocalFiltros(reset);
    onApply(reset);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔍 Filtros Avançados</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Card>
              <Text style={styles.sectionTitle}>Busca</Text>
              <TextInput
                style={styles.input}
                placeholder="Buscar por endereço, plataforma..."
                value={localFiltros.busca}
                onChangeText={(text) => setLocalFiltros({ ...localFiltros, busca: text })}
              />
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Plataforma</Text>
              <View style={styles.plataformaButtons}>
                {['', 'uber', '99', 'ifood'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.plataformaButton,
                      localFiltros.plataforma === p && styles.plataformaButtonActive,
                    ]}
                    onPress={() => setLocalFiltros({ ...localFiltros, plataforma: p })}
                  >
                    <Text
                      style={[
                        styles.plataformaButtonText,
                        localFiltros.plataforma === p && styles.plataformaButtonTextActive,
                      ]}
                    >
                      {p || 'Todas'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Valor</Text>
              <View style={styles.valorRow}>
                <View style={styles.valorInput}>
                  <Text style={styles.label}>Mínimo (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0,00"
                    value={localFiltros.valorMin}
                    onChangeText={(text) => setLocalFiltros({ ...localFiltros, valorMin: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.valorInput}>
                  <Text style={styles.label}>Máximo (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0,00"
                    value={localFiltros.valorMax}
                    onChangeText={(text) => setLocalFiltros({ ...localFiltros, valorMax: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Viabilidade</Text>
              <View style={styles.viabilidadeButtons}>
                {[
                  { key: '', label: 'Todas' },
                  { key: 'excelente', label: 'Excelente' },
                  { key: 'boa', label: 'Boa' },
                  { key: 'razoavel', label: 'Razoável' },
                  { key: 'ruim', label: 'Ruim' },
                  { key: 'pessima', label: 'Péssima' },
                ].map((v) => (
                  <TouchableOpacity
                    key={v.key}
                    style={[
                      styles.viabilidadeButton,
                      localFiltros.viabilidade === v.key && styles.viabilidadeButtonActive,
                    ]}
                    onPress={() => setLocalFiltros({ ...localFiltros, viabilidade: v.key })}
                  >
                    <Text
                      style={[
                        styles.viabilidadeButtonText,
                        localFiltros.viabilidade === v.key && styles.viabilidadeButtonTextActive,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Limpar"
              variant="outline"
              onPress={handleReset}
              style={styles.footerButton}
            />
            <Button
              title="Aplicar Filtros"
              onPress={handleApply}
              style={[styles.footerButton, styles.footerButtonPrimary]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  plataformaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  plataformaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  plataformaButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  plataformaButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  plataformaButtonTextActive: {
    color: '#FFFFFF',
  },
  valorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  valorInput: {
    flex: 1,
  },
  viabilidadeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  viabilidadeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viabilidadeButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  viabilidadeButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  viabilidadeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
  },
  footerButtonPrimary: {
    flex: 2,
  },
});

