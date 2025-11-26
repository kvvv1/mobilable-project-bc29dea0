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
import Card from './Card';

const PERFIS_TRABALHO = [
  { id: 'giro-rapido', label: 'Giro Rápido', icon: 'flash-outline', color: '#6BBD9B', desc: 'Corridas curtas e rápidas' },
  { id: 'corridas-longas', label: 'Corridas Longas', icon: 'trending-up-outline', color: '#6BBD9B', desc: 'Valor alto por corrida' },
  { id: 'misto', label: 'Misto', icon: 'sync-outline', color: '#3B82F6', desc: 'Equilibrado' },
];

export default function PerfilTrabalhoSelector({ selected, onSelect }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const selectedPerfil = PERFIS_TRABALHO.find((p) => p.id === selected) || PERFIS_TRABALHO[0];

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

  const handleSelect = (perfilId) => {
    onSelect(perfilId);
    closeModal();
  };

  return (
    <Card>
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="briefcase-outline" size={20} color="#111827" />
        <Text style={styles.sectionTitle}>Perfil de Trabalho</Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { borderColor: selectedPerfil.color, backgroundColor: `${selectedPerfil.color}10` },
        ]}
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Selecionar perfil de trabalho. Perfil atual: ${selectedPerfil.label}`}
        accessibilityHint="Toque duas vezes para abrir o menu de perfis de trabalho"
      >
        <View style={styles.dropdownContent}>
          <View style={[styles.iconContainer, { backgroundColor: selectedPerfil.color }]}>
            <Ionicons name={selectedPerfil.icon} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.dropdownTextContainer}>
            <Text style={styles.dropdownLabel}>{selectedPerfil.label}</Text>
            <Text style={styles.dropdownHint}>{selectedPerfil.desc}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={selectedPerfil.color} />
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
                <Text style={styles.modalTitle}>Selecione o Perfil de Trabalho</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {PERFIS_TRABALHO.map((perfil, index) => {
                  const isSelected = selected === perfil.id;
                  return (
                    <TouchableOpacity
                      key={perfil.id}
                      style={[
                        styles.optionItem,
                        isSelected && { backgroundColor: `${perfil.color}15` },
                        index === PERFIS_TRABALHO.length - 1 && styles.lastOption,
                      ]}
                      onPress={() => handleSelect(perfil.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${perfil.label} - ${perfil.desc}${isSelected ? ' - Selecionado' : ''}`}
                      accessibilityHint={isSelected ? 'Perfil de trabalho já selecionado' : 'Toque duas vezes para selecionar este perfil'}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.optionIconContainer,
                            { backgroundColor: isSelected ? perfil.color : `${perfil.color}20` },
                          ]}
                        >
                          <Ionicons
                            name={perfil.icon}
                            size={22}
                            color={isSelected ? '#FFFFFF' : perfil.color}
                          />
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text style={[styles.optionLabel, isSelected && { color: perfil.color, fontWeight: '600' }]}>
                            {perfil.label}
                          </Text>
                          <Text style={styles.optionDesc}>{perfil.desc}</Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.checkContainer, { backgroundColor: perfil.color }]}>
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

