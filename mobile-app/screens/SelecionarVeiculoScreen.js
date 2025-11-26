import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { StorageService } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/authService';

// Veículos populares no Brasil com consumo médio real
const VEICULOS_POPULARES = [
  // Motos
  { id: 'honda-cg-160', tipo: 'moto', marca: 'Honda', modelo: 'CG 160', consumo: 38, ano: '2020-2024' },
  { id: 'honda-cg-160-fan', tipo: 'moto', marca: 'Honda', modelo: 'CG 160 Fan', consumo: 40, ano: '2020-2024' },
  { id: 'honda-biz-125', tipo: 'moto', marca: 'Honda', modelo: 'Biz 125', consumo: 42, ano: '2020-2024' },
  { id: 'yamaha-factor-150', tipo: 'moto', marca: 'Yamaha', modelo: 'Factor 150', consumo: 36, ano: '2020-2024' },
  { id: 'yamaha-fazer-150', tipo: 'moto', marca: 'Yamaha', modelo: 'Fazer 150', consumo: 35, ano: '2020-2024' },
  { id: 'honda-pop-110i', tipo: 'moto', marca: 'Honda', modelo: 'Pop 110i', consumo: 45, ano: '2020-2024' },
  { id: 'honda-xre-300', tipo: 'moto', marca: 'Honda', modelo: 'XRE 300', consumo: 30, ano: '2020-2024' },
  { id: 'yamaha-xtz-250', tipo: 'moto', marca: 'Yamaha', modelo: 'XTZ 250', consumo: 28, ano: '2020-2024' },
  
  // Carros Populares
  { id: 'fiat-uno', tipo: 'carro', marca: 'Fiat', modelo: 'Uno', consumo: 13.5, ano: '2010-2024' },
  { id: 'fiat-palio', tipo: 'carro', marca: 'Fiat', modelo: 'Palio', consumo: 13, ano: '2010-2024' },
  { id: 'volkswagen-gol', tipo: 'carro', marca: 'Volkswagen', modelo: 'Gol', consumo: 12.5, ano: '2010-2024' },
  { id: 'chevrolet-onix', tipo: 'carro', marca: 'Chevrolet', modelo: 'Onix', consumo: 14, ano: '2012-2024' },
  { id: 'chevrolet-prisma', tipo: 'carro', marca: 'Chevrolet', modelo: 'Prisma', consumo: 13.5, ano: '2012-2024' },
  { id: 'fiat-mobi', tipo: 'carro', marca: 'Fiat', modelo: 'Mobi', consumo: 14.5, ano: '2016-2024' },
  { id: 'renault-kwid', tipo: 'carro', marca: 'Renault', modelo: 'Kwid', consumo: 15, ano: '2017-2024' },
  { id: 'hyundai-hb20', tipo: 'carro', marca: 'Hyundai', modelo: 'HB20', consumo: 13, ano: '2012-2024' },
  { id: 'ford-ka', tipo: 'carro', marca: 'Ford', modelo: 'Ka', consumo: 13.5, ano: '2014-2024' },
  { id: 'toyota-corolla', tipo: 'carro', marca: 'Toyota', modelo: 'Corolla', consumo: 11, ano: '2010-2024' },
  { id: 'honda-civic', tipo: 'carro', marca: 'Honda', modelo: 'Civic', consumo: 10.5, ano: '2010-2024' },
  { id: 'chevrolet-spin', tipo: 'carro', marca: 'Chevrolet', modelo: 'Spin', consumo: 11.5, ano: '2012-2024' },
  { id: 'fiat-strada', tipo: 'carro', marca: 'Fiat', modelo: 'Strada', consumo: 12, ano: '2010-2024' },
  { id: 'volkswagen-voyage', tipo: 'carro', marca: 'Volkswagen', modelo: 'Voyage', consumo: 12.5, ano: '2010-2024' },
  { id: 'chevrolet-celta', tipo: 'carro', marca: 'Chevrolet', modelo: 'Celta', consumo: 13, ano: '2010-2015' },
];

export default function SelecionarVeiculoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [buscaVeiculo, setBuscaVeiculo] = useState('');
  const [veiculoAtual, setVeiculoAtual] = useState(null);

  // Carregar veículo atual ao montar componente
  useEffect(() => {
    loadVeiculoAtual();
  }, []);

  const loadVeiculoAtual = async () => {
    try {
      const configData = await StorageService.getConfig();
      if (configData?.veiculo) {
        setVeiculoAtual(configData.veiculo);
      }
    } catch (error) {
      console.error('Erro ao carregar veículo atual:', error);
    }
  };

  const isVeiculoSelecionado = (v) => {
    if (!veiculoAtual) return false;
    // Verificar se é o Fiat Uno selecionado
    if (v.id === 'fiat-uno') {
      return veiculoAtual.marca === 'Fiat' && veiculoAtual.modelo === 'Uno';
    }
    // Para outros veículos, verificar por marca e modelo
    return veiculoAtual.marca === v.marca && veiculoAtual.modelo === v.modelo;
  };

  // Filtrar veículos por busca
  const getVeiculosFiltrados = () => {
    if (!buscaVeiculo.trim()) {
      return VEICULOS_POPULARES;
    }
    const busca = buscaVeiculo.toLowerCase();
    return VEICULOS_POPULARES.filter(v => 
      v.marca.toLowerCase().includes(busca) ||
      v.modelo.toLowerCase().includes(busca) ||
      `${v.marca} ${v.modelo}`.toLowerCase().includes(busca)
    );
  };

  // Selecionar veículo da lista
  const selecionarVeiculo = async (veiculoSelecionado) => {
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
        // Extrair ano do formato "2020-2024" ou usar null
        const ano = veiculoSelecionado.ano?.split('-')[0] || null;
        
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            organization_id: organizationId,
            user_id: user.id,
            tipo: veiculoSelecionado.tipo,
            marca: veiculoSelecionado.marca,
            modelo: veiculoSelecionado.modelo,
            ano: ano,
            consumo_medio: veiculoSelecionado.consumo,
            personalizado: false,
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
        id: vehicleId || veiculoSelecionado.id,
        tipo: veiculoSelecionado.tipo,
        marca: veiculoSelecionado.marca,
        modelo: veiculoSelecionado.modelo,
        ano: veiculoSelecionado.ano,
        consumo: veiculoSelecionado.consumo.toString(),
        personalizado: false,
      };
      
      // Atualizar configurações localmente também
      const configData = await StorageService.getConfig();
      await StorageService.saveConfig({
        ...configData,
        veiculo: novoVeiculo,
        mediaKmPorLitro: veiculoSelecionado.consumo,
        tipoVeiculo: veiculoSelecionado.tipo,
      });
      
      // Atualizar veículo atual após seleção
      setVeiculoAtual(novoVeiculo);
      
      Alert.alert('Sucesso', 'Veículo selecionado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o veículo. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Selecione por Modelo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por marca ou modelo..."
          placeholderTextColor="#9CA3AF"
          value={buscaVeiculo}
          onChangeText={setBuscaVeiculo}
          autoFocus
        />
        {buscaVeiculo.length > 0 && (
          <TouchableOpacity
            onPress={() => setBuscaVeiculo('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.list}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContent}
      >
        {getVeiculosFiltrados().length > 0 ? (
          getVeiculosFiltrados().map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.veiculoItem}
              onPress={() => selecionarVeiculo(v)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.veiculoItemIconContainer,
                v.id === 'fiat-uno' && isVeiculoSelecionado(v) && styles.veiculoItemIconContainerSelected
              ]}>
                <Ionicons
                  name={v.tipo === 'moto' ? 'bicycle-outline' : 'car-outline'}
                  size={24}
                  color="#6BBD9B"
                />
                {v.id === 'fiat-uno' && isVeiculoSelecionado(v) && (
                  <View style={styles.iconBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#6BBD9B" />
                  </View>
                )}
              </View>
              <View style={styles.veiculoItemInfo}>
                <Text style={styles.veiculoItemNome}>
                  {v.marca} {v.modelo}
                </Text>
                <Text style={styles.veiculoItemDetalhes}>
                  {v.ano} • {v.consumo} km/L
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              Nenhum veículo encontrado
            </Text>
            <Text style={styles.emptySubtext}>
              Tente buscar por outra marca ou modelo
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  veiculoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  veiculoItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  veiculoItemIconContainerSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#6BBD9B',
  },
  iconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6BBD9B',
  },
  veiculoItemInfo: {
    flex: 1,
  },
  veiculoItemNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  veiculoItemDetalhes: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});




