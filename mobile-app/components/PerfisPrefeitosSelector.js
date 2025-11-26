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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { useTheme } from '../contexts/ThemeContext';

const PERFIS_TRABALHO = [
  { id: 'giro-rapido', label: 'Giro Rápido' },
  { id: 'corridas-longas', label: 'Corridas Longas' },
  { id: 'misto', label: 'Misto' },
];

// Função auxiliar para obter ícone baseado no tipo de veículo e perfil
const getPerfilIcon = (tipoVeiculo, perfilTrabalho) => {
  if (tipoVeiculo === 'moto') {
    if (perfilTrabalho === 'giro-rapido') return 'flash-outline';
    if (perfilTrabalho === 'corridas-longas') return 'trending-up-outline';
    return 'sync-outline';
  } else {
    if (perfilTrabalho === 'giro-rapido') return 'car-sport-outline';
    if (perfilTrabalho === 'corridas-longas') return 'airplane-outline';
    return 'settings-outline';
  }
};

// Função auxiliar para obter cor baseada no tipo de veículo
const getPerfilColor = (tipoVeiculo, perfilTrabalho) => {
  if (tipoVeiculo === 'moto') {
    if (perfilTrabalho === 'giro-rapido') return '#6BBD9B';
    if (perfilTrabalho === 'corridas-longas') return '#6BBD9B';
    return '#3B82F6';
  } else {
    if (perfilTrabalho === 'giro-rapido') return '#F59E0B';
    if (perfilTrabalho === 'corridas-longas') return '#EF4444';
    return '#6366F1';
  }
};

export default function PerfisPrefeitosSelector({ perfis, onAplicarPerfil, selectedPerfilId }) {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const selectedPerfil = perfis.find((p) => p.id === selectedPerfilId) || null;
  const defaultColor = '#6BBD9B';

  const openModal = () => {
    if (perfis.length === 0) {
      Alert.alert(
        'Sem Perfis Disponíveis',
        'Configure o consumo do veículo acima para ver perfis recomendados.',
        [{ text: 'OK' }]
      );
      return;
    }
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

  const handleSelect = (perfil) => {
    closeModal();
    // Chama a função que aplica o perfil (que já tem o Alert integrado)
    if (onAplicarPerfil) {
      onAplicarPerfil(perfil);
    }
  };

  const getTipoVeiculoIcon = (tipoVeiculo) => {
    return tipoVeiculo === 'moto' ? 'bicycle-outline' : 'car-outline';
  };

  if (perfis.length === 0) {
    return (
      <Card>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="star-outline" size={20} color={theme.colors.text} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Perfis Pré-Feitos Recomendados
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={48} color="#9CA3AF" />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Configure o consumo do veículo acima para ver perfis recomendados
          </Text>
        </View>
      </Card>
    );
  }

  const displayPerfil = selectedPerfil || perfis[0];
  const perfilColor = selectedPerfil
    ? getPerfilColor(selectedPerfil.tipoVeiculo, selectedPerfil.config.perfilTrabalho)
    : defaultColor;

  return (
    <Card>
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="star-outline" size={20} color={theme.colors.text} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Perfis Pré-Feitos Recomendados
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            borderColor: perfilColor,
            backgroundColor: `${perfilColor}10`,
          },
        ]}
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Selecionar perfil pré-feito. ${selectedPerfil ? `Perfil atual: ${selectedPerfil.label}` : 'Nenhum perfil selecionado'}`}
        accessibilityHint="Toque duas vezes para abrir o menu de perfis pré-feitos"
      >
        <View style={styles.dropdownContent}>
          <View style={[styles.iconContainer, { backgroundColor: perfilColor }]}>
            <Ionicons
              name={selectedPerfil ? getPerfilIcon(displayPerfil.tipoVeiculo, displayPerfil.config.perfilTrabalho) : 'star-outline'}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.dropdownTextContainer}>
            <Text style={styles.dropdownLabel}>
              {selectedPerfil ? selectedPerfil.label : 'Selecione um Perfil'}
            </Text>
            <Text style={styles.dropdownHint}>
              {selectedPerfil ? selectedPerfil.desc : `${perfis.length} perfis disponíveis`}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={perfilColor} />
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
                <Text style={styles.modalTitle}>Selecione um Perfil Pré-Feito</Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {perfis.map((perfil, index) => {
                  const isSelected = selectedPerfilId === perfil.id;
                  const perfilIcon = getPerfilIcon(perfil.tipoVeiculo, perfil.config.perfilTrabalho);
                  const perfilColor = getPerfilColor(perfil.tipoVeiculo, perfil.config.perfilTrabalho);
                  const tipoVeiculoIcon = getTipoVeiculoIcon(perfil.tipoVeiculo);
                  const perfilTrabalhoLabel = PERFIS_TRABALHO.find(
                    (p) => p.id === perfil.config.perfilTrabalho
                  )?.label || 'Misto';

                  return (
                    <TouchableOpacity
                      key={perfil.id}
                      style={[
                        styles.optionItem,
                        isSelected && { backgroundColor: `${perfilColor}15` },
                        index === perfis.length - 1 && styles.lastOption,
                      ]}
                      onPress={() => handleSelect(perfil)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${perfil.label} - ${perfil.desc}${isSelected ? ' - Selecionado' : ''}`}
                      accessibilityHint={isSelected ? 'Perfil já selecionado' : 'Toque duas vezes para selecionar este perfil'}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.optionIconContainer,
                            { backgroundColor: isSelected ? perfilColor : `${perfilColor}20` },
                          ]}
                        >
                          <Ionicons
                            name={perfilIcon}
                            size={22}
                            color={isSelected ? '#FFFFFF' : perfilColor}
                          />
                        </View>
                        <View style={styles.optionTextContainer}>
                          <View style={styles.optionHeader}>
                            <Text
                              style={[
                                styles.optionLabel,
                                isSelected && { color: perfilColor, fontWeight: '600' },
                              ]}
                            >
                              {perfil.label}
                            </Text>
                            <View style={styles.optionBadges}>
                              <View style={[styles.badge, { backgroundColor: `${perfilColor}20` }]}>
                                <Ionicons name={tipoVeiculoIcon} size={12} color={perfilColor} />
                                <Text style={[styles.badgeText, { color: perfilColor }]}>
                                  {perfil.tipoVeiculo === 'moto' ? 'Moto' : 'Carro'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Text style={styles.optionDesc}>{perfil.desc}</Text>
                          <Text style={styles.optionSubDesc}>
                            Perfil: {perfilTrabalhoLabel} • R$ {perfil.config.rsPorKmMinimo}/km
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.checkContainer, { backgroundColor: perfilColor }]}>
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
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
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  optionBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  optionSubDesc: {
    fontSize: 11,
    color: '#9CA3AF',
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

