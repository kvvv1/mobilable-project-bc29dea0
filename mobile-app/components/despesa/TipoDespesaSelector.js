import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';

const TIPOS_DESPESA = [
  { id: 'combustivel', label: 'Combustível', icon: 'car-outline', color: '#F59E0B' },
  { id: 'manutencao', label: 'Manutenção', icon: 'build-outline', color: '#6366F1' },
  { id: 'alimentacao', label: 'Alimentação', icon: 'restaurant-outline', color: '#EC4899' },
  { id: 'estacionamento', label: 'Estacionamento', icon: 'location-outline', color: '#6BBD9B' },
  { id: 'lavagem', label: 'Lavagem', icon: 'water-outline', color: '#06B6D4' },
  { id: 'multa', label: 'Multa', icon: 'document-text-outline', color: '#EF4444' },
  { id: 'seguro', label: 'Seguro', icon: 'shield-checkmark-outline', color: '#6BBD9B' },
  { id: 'outros', label: 'Outros', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

export default function TipoDespesaSelector({ selected, onSelect }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const selectedTipo = TIPOS_DESPESA.find((t) => t.id === selected) || TIPOS_DESPESA[0];

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleSelect = (tipoId) => {
    onSelect(tipoId);
    closeModal();
  };

  return (
    <Card>
      <Text style={styles.sectionTitle}>Tipo de Despesa *</Text>
      
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { borderColor: selectedTipo.color, backgroundColor: `${selectedTipo.color}10` },
        ]}
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Selecionar tipo de despesa. Tipo atual: ${selectedTipo.label}`}
        accessibilityHint="Toque duas vezes para abrir o menu de tipos de despesa"
      >
        <View style={styles.dropdownContent}>
          <View style={[styles.iconContainer, { backgroundColor: selectedTipo.color }]}>
            <Ionicons name={selectedTipo.icon} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.dropdownTextContainer}>
            <Text style={styles.dropdownLabel}>{selectedTipo.label}</Text>
            <Text style={styles.dropdownHint}>Toque para alterar</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={selectedTipo.color} />
        </View>
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecione o Tipo de Despesa</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {TIPOS_DESPESA.map((tipo, index) => {
                  const isSelected = selected === tipo.id;
                  return (
                    <TouchableOpacity
                      key={tipo.id}
                      style={[
                        styles.optionItem,
                        isSelected && { backgroundColor: `${tipo.color}15` },
                        index === TIPOS_DESPESA.length - 1 && styles.lastOption,
                      ]}
                      onPress={() => handleSelect(tipo.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${tipo.label}${isSelected ? ' - Selecionado' : ''}`}
                      accessibilityHint={isSelected ? 'Tipo de despesa já selecionado' : 'Toque duas vezes para selecionar este tipo'}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.optionIconContainer,
                            { backgroundColor: isSelected ? tipo.color : `${tipo.color}20` },
                          ]}
                        >
                          <Ionicons
                            name={tipo.icon}
                            size={22}
                            color={isSelected ? '#FFFFFF' : tipo.color}
                          />
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text style={[styles.optionLabel, isSelected && { color: tipo.color, fontWeight: '600' }]}>
                            {tipo.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.checkContainer, { backgroundColor: tipo.color }]}>
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dropdownButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dropdownHint: {
    fontSize: 12,
    color: '#6B7280',
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
    maxHeight: '80%',
    paddingBottom: 32,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 500,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
