import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { StorageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/authService';

export default function CadastrarVeiculoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [veiculo, setVeiculo] = useState({
    tipo: 'moto',
    marca: '',
    modelo: '',
    ano: '',
    consumo: '',
  });
  const [loading, setLoading] = useState(false);

  // Salvar veículo personalizado
  const salvarVeiculoPersonalizado = async () => {
    if (!veiculo.marca || !veiculo.modelo || !veiculo.consumo) {
      Alert.alert('Atenção', 'Preencha marca, modelo e consumo do veículo.');
      return;
    }

    setLoading(true);
    
    try {
      // Buscar organization_id do perfil do usuário
      let organizationId = null;
      if (user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('current_organization_id')
          .eq('id', user.id)
          .single();

        if (!profileError && profile?.current_organization_id) {
          organizationId = profile.current_organization_id;
        }
      }

      // Salvar no Supabase se tiver organization_id
      let vehicleId = null;
      if (organizationId && user?.id) {
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            organization_id: organizationId,
            user_id: user.id,
            tipo: veiculo.tipo,
            marca: veiculo.marca,
            modelo: veiculo.modelo,
            ano: veiculo.ano || null,
            consumo_medio: parseFloat(veiculo.consumo.replace(',', '.')),
            personalizado: true,
          })
          .select()
          .single();

        if (!vehicleError && vehicle) {
          vehicleId = vehicle.id;
        } else {
          console.warn('Erro ao salvar veículo no Supabase:', vehicleError);
        }
      }
    
      const novoVeiculo = {
        id: vehicleId || `personalizado-${Date.now()}`,
        tipo: veiculo.tipo,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        consumo: veiculo.consumo,
        personalizado: true,
      };
      
      // Atualizar configurações localmente também
      const configData = await StorageService.getConfig();
      await StorageService.saveConfig({
        ...configData,
        veiculo: novoVeiculo,
        mediaKmPorLitro: parseFloat(veiculo.consumo.replace(',', '.')),
        tipoVeiculo: veiculo.tipo,
      });
      
      Alert.alert('Sucesso', 'Veículo personalizado salvo!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o veículo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Cadastrar Veículo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Preencha as informações do seu veículo
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Veículo *</Text>
            <View style={styles.tipoVeiculoButtons}>
              {['moto', 'carro'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.tipoVeiculoButton,
                    veiculo.tipo === tipo && styles.tipoVeiculoButtonActive,
                  ]}
                  onPress={() => setVeiculo({ ...veiculo, tipo })}
                  activeOpacity={0.7}
                >
                  <View style={styles.tipoVeiculoButtonIconContainer}>
                    <Ionicons
                      name={tipo === 'moto' ? 'bicycle-outline' : 'car-outline'}
                      size={24}
                      color={veiculo.tipo === tipo ? '#FFFFFF' : '#8B5CF6'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tipoVeiculoButtonLabel,
                      veiculo.tipo === tipo && styles.tipoVeiculoButtonLabelActive,
                    ]}
                  >
                    {tipo === 'moto' ? 'Moto' : 'Carro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marca *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Honda, Fiat, Chevrolet..."
              placeholderTextColor="#9CA3AF"
              value={veiculo.marca}
              onChangeText={(text) => setVeiculo({ ...veiculo, marca: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modelo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: CG 160, Uno, Onix..."
              placeholderTextColor="#9CA3AF"
              value={veiculo.modelo}
              onChangeText={(text) => setVeiculo({ ...veiculo, modelo: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ano (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2020"
              placeholderTextColor="#9CA3AF"
              value={veiculo.ano}
              onChangeText={(text) => setVeiculo({ ...veiculo, ano: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Consumo Médio (km/L) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 35 (moto) ou 12 (carro)"
              placeholderTextColor="#9CA3AF"
              value={veiculo.consumo}
              onChangeText={(text) => setVeiculo({ ...veiculo, consumo: text })}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>
              Informe o consumo médio do seu veículo em km por litro
            </Text>
          </View>

          <Button
            title="Salvar Veículo"
            onPress={salvarVeiculoPersonalizado}
            style={styles.saveButton}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  tipoVeiculoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tipoVeiculoButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tipoVeiculoButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tipoVeiculoButtonIconContainer: {
    marginBottom: 12,
  },
  tipoVeiculoButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  tipoVeiculoButtonLabelActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 8,
  },
});




