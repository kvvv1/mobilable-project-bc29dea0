import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/authService';
import { StorageService } from '../services/storage';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

// Veículos populares
const POPULAR_VEHICLES = [
  { id: 'honda-cg-160', tipo: 'moto', marca: 'Honda', modelo: 'CG 160', consumo: 38 },
  { id: 'honda-biz-125', tipo: 'moto', marca: 'Honda', modelo: 'Biz 125', consumo: 42 },
  { id: 'yamaha-factor-150', tipo: 'moto', marca: 'Yamaha', modelo: 'Factor 150', consumo: 36 },
  { id: 'fiat-uno', tipo: 'carro', marca: 'Fiat', modelo: 'Uno', consumo: 13.5 },
  { id: 'volkswagen-gol', tipo: 'carro', marca: 'Volkswagen', modelo: 'Gol', consumo: 12.5 },
  { id: 'chevrolet-onix', tipo: 'carro', marca: 'Chevrolet', modelo: 'Onix', consumo: 14 },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, completeOnboarding, updateProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Tipo de veículo
  const [tipoVeiculo, setTipoVeiculo] = useState(null);

  // Step 2: Seleção/Cadastro de veículo
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [veiculoPersonalizado, setVeiculoPersonalizado] = useState({
    marca: '',
    modelo: '',
    ano: '',
    consumo: '',
  });

  // Step 3: Configurações básicas
  const [config, setConfig] = useState({
    rsPorKmMinimo: '1.80',
    rsPorHoraMinimo: '25.00',
    precoCombustivel: '6.00',
    perfilTrabalho: 'misto',
  });

  const handleNext = () => {
    if (step === 1 && !tipoVeiculo) {
      Alert.alert('Atenção', 'Selecione o tipo de veículo');
      return;
    }
    if (step === 2 && !veiculoSelecionado && !veiculoPersonalizado.marca) {
      Alert.alert('Atenção', 'Selecione ou cadastre um veículo');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);

    try {
      if (!user?.id) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        setLoading(false);
        return;
      }

      // Buscar organização do usuário (verificar se já existe antes de criar)
      let profile = null;
      let organizationId = null;

      // Primeiro, verificar se já existe uma organização para este usuário
      logger.debug('Verificando se organização já existe para o usuário...');
      const { data: existingOrg, error: orgCheckError } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      if (existingOrg && !orgCheckError) {
        // Organização já existe
        organizationId = existingOrg.id;
        logger.debug('Organização encontrada:', organizationId);
        
        // Verificar se o perfil existe e atualizar se necessário
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('current_organization_id')
          .eq('id', user.id)
          .single();

        if (existingProfile) {
          profile = existingProfile;
          // Se o perfil não tem organization_id, atualizar
          if (!existingProfile.current_organization_id) {
            await supabase
              .from('user_profiles')
              .update({ current_organization_id: organizationId })
              .eq('id', user.id);
          }
        } else if (profileCheckError?.code === 'PGRST116') {
          // Perfil não existe, criar
          logger.debug('Perfil não encontrado - criando perfil...');
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
              current_organization_id: organizationId,
            });

          if (profileError) {
            logger.error('Erro ao criar perfil:', profileError);
            // Continuar mesmo assim se a organização existe
          }
        }
      } else {
        // Organização não existe - verificar perfil primeiro
        logger.debug('Organização não encontrada - verificando perfil...');
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('current_organization_id')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Nem perfil nem organização existem - criar ambos
          logger.debug('Perfil e organização não encontrados - criando ambos...');
          
          try {
            // Criar organização
            const orgName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Minha Organização';
            const orgSlug = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            logger.debug('Tentando criar organização:', { name: orgName, slug: orgSlug, owner_id: user.id });
            
            const { data: newOrg, error: orgError } = await supabase
              .from('organizations')
              .insert({
                name: orgName,
                slug: orgSlug,
                owner_id: user.id,
                subscription_status: 'trial',
                subscription_plan: 'free',
              })
              .select()
              .single();

            if (orgError) {
              // Se o erro for de recursão RLS, aguardar um pouco e tentar novamente
              if (orgError.code === '42P17') {
                logger.warn('Erro de recursão RLS detectado - aguardando e tentando novamente...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Tentar buscar a organização novamente (pode ter sido criada pelo trigger)
                const { data: retryOrg } = await supabase
                  .from('organizations')
                  .select('id')
                  .eq('owner_id', user.id)
                  .limit(1)
                  .single();
                
                if (retryOrg) {
                  organizationId = retryOrg.id;
                  logger.debug('Organização encontrada após retry:', organizationId);
                } else {
                  logger.error('Erro ao criar organização (após retry):', orgError);
                  Alert.alert('Erro', 'Não foi possível criar a organização. Por favor, tente fazer logout e login novamente.');
                  setLoading(false);
                  return;
                }
              } else {
                logger.error('Erro ao criar organização:', orgError);
                Alert.alert('Erro', `Não foi possível criar a organização: ${orgError.message || 'Erro desconhecido'}`);
                setLoading(false);
                return;
              }
            } else {
              organizationId = newOrg.id;
              logger.debug('Organização criada com sucesso:', organizationId);
            }

            // Se a organização foi criada, adicionar como membro (se ainda não for)
            if (organizationId) {
              const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                  organization_id: organizationId,
                  user_id: user.id,
                  role: 'owner',
                  joined_at: new Date().toISOString(),
                })
                .select();

              if (memberError && !memberError.message.includes('duplicate')) {
                logger.error('Erro ao adicionar membro:', memberError);
                // Continuar mesmo assim
              }

              // Criar perfil
              const { error: profileCreateError } = await supabase
                .from('user_profiles')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                  current_organization_id: organizationId,
                });

              if (profileCreateError && !profileCreateError.message.includes('duplicate')) {
                logger.error('Erro ao criar perfil:', profileCreateError);
                // Continuar mesmo assim se a organização foi criada
              }

              // Criar configurações padrão (ignorar erro se já existir)
              await supabase
                .from('organization_settings')
                .insert({
                  organization_id: organizationId,
                });

              logger.debug('Organização e perfil criados com sucesso:', organizationId);
            }
          } catch (createError) {
            logger.error('Erro ao criar organização/perfil:', createError);
            Alert.alert('Erro', 'Não foi possível criar a organização. Verifique sua conexão e tente novamente.');
            setLoading(false);
            return;
          }
        } else if (profileData) {
          // Perfil existe mas sem organização
          profile = profileData;
          organizationId = profileData?.current_organization_id;
          
          if (!organizationId) {
            logger.warn('Perfil existe mas sem organização - isso não deveria acontecer');
            Alert.alert('Erro', 'Organização não encontrada. Por favor, faça logout e login novamente.');
            setLoading(false);
            return;
          }
        } else if (profileError) {
          logger.error('Erro ao buscar perfil:', profileError);
          Alert.alert('Erro', 'Não foi possível buscar o perfil. Tente novamente.');
          setLoading(false);
          return;
        }
      }

      if (!organizationId) {
        logger.error('Organização não encontrada após todas as tentativas');
        Alert.alert('Erro', 'Organização não encontrada. Por favor, faça logout e login novamente.');
        setLoading(false);
        return;
      }

      // 1. Salvar veículo
      let vehicleId = null;
      if (veiculoSelecionado) {
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            organization_id: organizationId,
            user_id: user?.id,
            tipo: veiculoSelecionado.tipo,
            marca: veiculoSelecionado.marca,
            modelo: veiculoSelecionado.modelo,
            ano: veiculoSelecionado.ano || null,
            consumo_medio: veiculoSelecionado.consumo,
            personalizado: false,
          })
          .select()
          .single();

        if (!vehicleError) vehicleId = vehicle.id;
      } else if (veiculoPersonalizado.marca) {
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            organization_id: organizationId,
            user_id: user?.id,
            tipo: tipoVeiculo,
            marca: veiculoPersonalizado.marca,
            modelo: veiculoPersonalizado.modelo,
            ano: veiculoPersonalizado.ano || null,
            consumo_medio: parseFloat(veiculoPersonalizado.consumo.replace(',', '.')),
            personalizado: true,
          })
          .select()
          .single();

        if (!vehicleError) vehicleId = vehicle.id;
      }

      // 2. Salvar configurações
      const consumo = veiculoSelecionado?.consumo || parseFloat(veiculoPersonalizado.consumo.replace(',', '.'));
      
      const settingsData = {
        rs_por_km_minimo: parseFloat(config.rsPorKmMinimo.replace(',', '.')),
        rs_por_hora_minimo: parseFloat(config.rsPorHoraMinimo.replace(',', '.')),
        preco_combustivel: parseFloat(config.precoCombustivel.replace(',', '.')),
        media_km_por_litro: consumo,
        perfil_trabalho: config.perfilTrabalho,
      };

      // Atualizar no Supabase
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .update(settingsData)
        .eq('organization_id', organizationId);

      // Salvar localmente também
      await StorageService.saveConfig({
        ...settingsData,
        veiculo: veiculoSelecionado || {
          tipo: tipoVeiculo,
          marca: veiculoPersonalizado.marca,
          modelo: veiculoPersonalizado.modelo,
          consumo: consumo.toString(),
        },
        tipoVeiculo,
      });

      // 3. Marcar onboarding como completo
      const onboardingResult = await completeOnboarding();
      
      if (!onboardingResult.success) {
        Alert.alert('Erro', 'Não foi possível finalizar a configuração. Tente novamente.');
        setLoading(false);
        return;
      }

      // 4. Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 5. Não navegar manualmente - o App.js vai detectar que onboarding está completo
      // e mostrará o Tutorial automaticamente
      // Fluxo: CADASTRO → ONBOARDING → App.js detecta → TUTORIAL → APP
      logger.debug('Onboarding completo, aguardando redirecionamento automático para Tutorial...');
    } catch (error) {
      // Erro já tratado no Alert
      Alert.alert('Erro', 'Não foi possível finalizar a configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="car-sport" size={64} color="#8B5CF6" />
      </View>
      <Text style={styles.stepTitle}>Qual seu tipo de veículo?</Text>
      <Text style={styles.stepSubtitle}>
        Isso nos ajuda a calcular os custos corretamente
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionCard,
            tipoVeiculo === 'moto' && styles.optionCardSelected,
          ]}
          onPress={() => setTipoVeiculo('moto')}
          activeOpacity={0.7}
        >
          <Text style={styles.optionIcon}>🏍️</Text>
          <Text style={styles.optionTitle}>Moto</Text>
          <Text style={styles.optionSubtitle}>Mais econômico</Text>
          {tipoVeiculo === 'moto' && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            tipoVeiculo === 'carro' && styles.optionCardSelected,
          ]}
          onPress={() => setTipoVeiculo('carro')}
          activeOpacity={0.7}
        >
          <Text style={styles.optionIcon}>🚗</Text>
          <Text style={styles.optionTitle}>Carro</Text>
          <Text style={styles.optionSubtitle}>Mais confortável</Text>
          {tipoVeiculo === 'carro' && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => {
    const vehicles = POPULAR_VEHICLES.filter((v) => v.tipo === tipoVeiculo);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Selecione seu veículo</Text>
        <Text style={styles.stepSubtitle}>
          Escolha da lista ou cadastre um personalizado
        </Text>

        <ScrollView
          style={styles.vehiclesList}
          showsVerticalScrollIndicator={false}
        >
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                veiculoSelecionado?.id === vehicle.id && styles.vehicleCardSelected,
              ]}
              onPress={() => {
                setVeiculoSelecionado(vehicle);
                setVeiculoPersonalizado({ marca: '', modelo: '', ano: '', consumo: '' });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.vehicleIcon}>
                {vehicle.tipo === 'moto' ? '🏍️' : '🚗'}
              </Text>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.marca} {vehicle.modelo}
                </Text>
                <Text style={styles.vehicleDetails}>
                  {vehicle.consumo} km/L
                </Text>
              </View>
              {veiculoSelecionado?.id === vehicle.id && (
                <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.vehicleCard,
              veiculoPersonalizado.marca && styles.vehicleCardSelected,
            ]}
            onPress={() => {
              setVeiculoSelecionado(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={32} color="#8B5CF6" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>Cadastrar Personalizado</Text>
              <Text style={styles.vehicleDetails}>
                Informe marca, modelo e consumo
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {!veiculoSelecionado && (
          <View style={styles.customVehicleForm}>
            <Text style={styles.sectionTitle}>Dados do Veículo</Text>
            <TextInput
              style={styles.input}
              placeholder="Marca (ex: Honda)"
              value={veiculoPersonalizado.marca}
              onChangeText={(text) =>
                setVeiculoPersonalizado({ ...veiculoPersonalizado, marca: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Modelo (ex: CG 160)"
              value={veiculoPersonalizado.modelo}
              onChangeText={(text) =>
                setVeiculoPersonalizado({ ...veiculoPersonalizado, modelo: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Ano (opcional)"
              value={veiculoPersonalizado.ano}
              onChangeText={(text) =>
                setVeiculoPersonalizado({ ...veiculoPersonalizado, ano: text })
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Consumo médio (km/L)"
              value={veiculoPersonalizado.consumo}
              onChangeText={(text) =>
                setVeiculoPersonalizado({ ...veiculoPersonalizado, consumo: text })
              }
              keyboardType="decimal-pad"
            />
          </View>
        )}
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="settings-outline" size={64} color="#8B5CF6" />
      </View>
      <Text style={styles.stepTitle}>Configure seus parâmetros</Text>
      <Text style={styles.stepSubtitle}>
        Ajuste os valores mínimos para análise de corridas
      </Text>

      <View style={styles.configContainer}>
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>R$ por km mínimo</Text>
          <TextInput
            style={styles.configInput}
            value={config.rsPorKmMinimo}
            onChangeText={(text) => setConfig({ ...config, rsPorKmMinimo: text })}
            keyboardType="decimal-pad"
            placeholder="1.80"
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>R$ por hora mínimo</Text>
          <TextInput
            style={styles.configInput}
            value={config.rsPorHoraMinimo}
            onChangeText={(text) => setConfig({ ...config, rsPorHoraMinimo: text })}
            keyboardType="decimal-pad"
            placeholder="25.00"
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Preço do combustível (R$/L)</Text>
          <TextInput
            style={styles.configInput}
            value={config.precoCombustivel}
            onChangeText={(text) => setConfig({ ...config, precoCombustivel: text })}
            keyboardType="decimal-pad"
            placeholder="6.00"
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Perfil de trabalho</Text>
          <View style={styles.profileOptions}>
            {['giro-rapido', 'corridas-longas', 'misto'].map((perfil) => (
              <TouchableOpacity
                key={perfil}
                style={[
                  styles.profileOption,
                  config.perfilTrabalho === perfil && styles.profileOptionSelected,
                ]}
                onPress={() => setConfig({ ...config, perfilTrabalho: perfil })}
              >
                <Text
                  style={[
                    styles.profileOptionText,
                    config.perfilTrabalho === perfil && styles.profileOptionTextSelected,
                  ]}
                >
                  {perfil === 'giro-rapido'
                    ? 'Giro Rápido'
                    : perfil === 'corridas-longas'
                    ? 'Corridas Longas'
                    : 'Misto'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#FFFFFF']}
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            disabled={step === 1}
          >
            {step > 1 && <Ionicons name="arrow-back" size={24} color="#111827" />}
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive,
                  s < step && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          {step < 3 ? (
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFinish}
              disabled={loading}
              style={[styles.finishButton, loading && styles.finishButtonDisabled]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.finishButtonText}>Finalizar</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#8B5CF6',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#8B5CF6',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  optionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  vehiclesList: {
    maxHeight: 400,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  vehicleCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  vehicleIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  customVehicleForm: {
    marginTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  configContainer: {
    gap: 24,
  },
  configItem: {
    gap: 8,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  configInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  profileOptions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  profileOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileOptionSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  profileOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  profileOptionTextSelected: {
    color: '#8B5CF6',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  finishButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

