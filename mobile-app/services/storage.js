import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './apiService';
import { SupabaseService } from './supabaseService';
import { supabase } from './authService';
import { logger } from '../utils/logger';

const STORAGE_KEYS = {
  CORRIDAS: 'corridas',
  DESPESAS: 'despesas',
  CONFIG: 'config',
  LAST_SYNC: 'last_sync',
};

// Verificar se o usuário está autenticado
const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
};

export const StorageService = {
  // Corridas
  async getCorridas() {
    try {
      // Se autenticado, tentar buscar do Supabase primeiro (direto, sem backend)
      if (await isAuthenticated()) {
        try {
          logger.debug('Tentando buscar corridas do Supabase (direto)...');
          const corridasSupabase = await SupabaseService.getCorridas({ limit: 1000 });
          
          // Sempre salvar no cache local (mesmo se vazio)
          await AsyncStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(corridasSupabase || []));
          
          if (corridasSupabase && corridasSupabase.length > 0) {
            logger.debug(`✅ Carregadas ${corridasSupabase.length} corridas do Supabase`);
            return corridasSupabase;
          } else {
            logger.debug('Nenhuma corrida encontrada no Supabase');
          }
        } catch (error) {
          // Erro silencioso - pode não ter conexão ou não estar autenticado
          logger.debug('Erro ao buscar do Supabase, usando dados locais:', error.message);
        }
      }

      // Fallback: buscar do AsyncStorage (sempre funciona)
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CORRIDAS);
      const corridasLocais = data ? JSON.parse(data) : [];
      logger.debug(`Carregadas ${corridasLocais.length} corridas do armazenamento local`);
      return corridasLocais;
    } catch (error) {
      logger.error('Erro ao buscar corridas:', error);
      return [];
    }
  },

  async saveCorrida(corrida) {
    try {
      const novaCorrida = {
        ...corrida,
        id: corrida.id || Date.now().toString(),
        createdAt: corrida.createdAt || new Date().toISOString(),
      };

      // Salvar localmente primeiro (para funcionar offline)
      const corridas = await this.getCorridas();
      const corridasAtualizadas = [...corridas, novaCorrida];
      await AsyncStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(corridasAtualizadas));

      // Se autenticado, salvar no Supabase também (direto, sem backend)
      if (await isAuthenticated()) {
        try {
          logger.debug('Salvando corrida no Supabase (direto)...');
          const corridaSupabase = await SupabaseService.saveCorrida(novaCorrida);
          
          // Atualizar com o ID do Supabase
          if (corridaSupabase?.id) {
            const index = corridasAtualizadas.findIndex(c => c.id === novaCorrida.id);
            if (index !== -1) {
              corridasAtualizadas[index] = { ...corridaSupabase, localId: novaCorrida.id };
              await AsyncStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(corridasAtualizadas));
            }
            logger.debug('✅ Corrida salva no Supabase com sucesso! ID:', corridaSupabase.id);
            return corridaSupabase;
          }
        } catch (error) {
          // Log mais detalhado para debug
          logger.error('❌ Erro ao salvar corrida no Supabase:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          logger.warn('Corrida salva localmente, será sincronizada depois');
          // Continuar mesmo se falhar no Supabase - já salvou localmente
        }
      } else {
        logger.debug('Usuário não autenticado, salvando apenas localmente');
      }

      return novaCorrida;
    } catch (error) {
      logger.error('Erro ao salvar corrida:', error);
      throw error;
    }
  },

  async deleteCorrida(id) {
    try {
      // Deletar localmente
      const corridas = await this.getCorridas();
      const filtered = corridas.filter(c => c.id !== id && c.localId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(filtered));

      // Se autenticado, deletar no Supabase também (direto, sem backend)
      if (await isAuthenticated()) {
        try {
          await SupabaseService.deleteCorrida(id);
        } catch (error) {
          logger.warn('Erro ao deletar corrida no Supabase:', error.message);
        }
      }

      return true;
    } catch (error) {
      logger.error('Erro ao deletar corrida:', error);
      return false;
    }
  },

  // Despesas
  async getDespesas() {
    try {
      // Se autenticado, tentar buscar do Supabase primeiro (direto, sem backend)
      if (await isAuthenticated()) {
        try {
          logger.debug('Tentando buscar despesas do Supabase (direto)...');
          const despesasSupabase = await SupabaseService.getDespesas({ limit: 1000 });
          
          // Sempre salvar no cache local (mesmo se vazio)
          await AsyncStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesasSupabase || []));
          
          if (despesasSupabase && despesasSupabase.length > 0) {
            logger.debug(`✅ Carregadas ${despesasSupabase.length} despesas do Supabase`);
            return despesasSupabase;
          } else {
            logger.debug('Nenhuma despesa encontrada no Supabase');
          }
        } catch (error) {
          // Erro silencioso - pode não ter conexão ou não estar autenticado
          logger.debug('Erro ao buscar do Supabase, usando dados locais:', error.message);
        }
      }

      // Fallback: buscar do AsyncStorage (sempre funciona)
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DESPESAS);
      const despesasLocais = data ? JSON.parse(data) : [];
      logger.debug(`Carregadas ${despesasLocais.length} despesas do armazenamento local`);
      return despesasLocais;
    } catch (error) {
      logger.error('Erro ao buscar despesas:', error);
      return [];
    }
  },

  async saveDespesa(despesa) {
    try {
      const novaDespesa = {
        ...despesa,
        id: despesa.id || Date.now().toString(),
        createdAt: despesa.createdAt || new Date().toISOString(),
      };

      // Salvar localmente primeiro (para funcionar offline)
      const despesas = await this.getDespesas();
      const despesasAtualizadas = [...despesas, novaDespesa];
      await AsyncStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesasAtualizadas));

      // Se autenticado, salvar no Supabase também (direto, sem backend)
      if (await isAuthenticated()) {
        try {
          logger.debug('Salvando despesa no Supabase (direto)...');
          const despesaSupabase = await SupabaseService.saveDespesa(novaDespesa);
          
          // Atualizar com o ID do Supabase
          if (despesaSupabase?.id) {
            const index = despesasAtualizadas.findIndex(d => d.id === novaDespesa.id);
            if (index !== -1) {
              despesasAtualizadas[index] = { ...despesaSupabase, localId: novaDespesa.id };
              await AsyncStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesasAtualizadas));
            }
            logger.debug('✅ Despesa salva no Supabase com sucesso! ID:', despesaSupabase.id);
            return despesaSupabase;
          }
        } catch (error) {
          // Log mais detalhado para debug
          logger.error('❌ Erro ao salvar despesa no Supabase:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          logger.warn('Despesa salva localmente, será sincronizada depois');
          // Continuar mesmo se falhar no Supabase - já salvou localmente
        }
      } else {
        logger.debug('Usuário não autenticado, salvando apenas localmente');
      }

      return novaDespesa;
    } catch (error) {
      logger.error('Erro ao salvar despesa:', error);
      throw error;
    }
  },

  async deleteDespesa(id) {
    try {
      // Deletar localmente
      const despesas = await this.getDespesas();
      const filtered = despesas.filter(d => d.id !== id && d.localId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(filtered));

      // Se autenticado, deletar no Supabase também (direto, sem backend)
      if (await isAuthenticated()) {
        try {
          await SupabaseService.deleteDespesa(id);
        } catch (error) {
          logger.warn('Erro ao deletar despesa no Supabase:', error.message);
        }
      }

      return true;
    } catch (error) {
      logger.error('Erro ao deletar despesa:', error);
      return false;
    }
  },

  // Configurações
  async getConfig() {
    try {
      // Se autenticado, tentar buscar do Supabase primeiro
      if (await isAuthenticated()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Buscar perfil do usuário para obter organization_id
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('current_organization_id')
              .eq('id', session.user.id)
              .single();

            if (profile?.current_organization_id) {
              // Buscar configurações do Supabase
              const { data: settings, error: settingsError } = await supabase
                .from('organization_settings')
                .select('*')
                .eq('organization_id', profile.current_organization_id)
                .single();

              if (!settingsError && settings) {
                // Converter do formato do Supabase para o formato do app
                const configFromSupabase = {
                  rsPorKmMinimo: settings.rs_por_km_minimo || 1.80,
                  rsPorHoraMinimo: settings.rs_por_hora_minimo || 25.00,
                  distanciaMaxima: settings.distancia_maxima || 10,
                  tempoMaximoEstimado: settings.tempo_maximo_estimado || 30,
                  mediaKmPorLitro: settings.media_km_por_litro || 12,
                  precoCombustivel: settings.preco_combustivel || 6.00,
                  perfilTrabalho: settings.perfil_trabalho || 'misto',
                  distanciaMaximaCliente: settings.distancia_maxima_cliente || 1.5,
                  preferenciasApps: settings.preferencias_apps || {
                    uber: { preferido: false, evitar: false },
                    '99': { preferido: false, evitar: false },
                    ifood: { preferido: false, evitar: false },
                  },
                  metaDiariaLucro: settings.meta_diaria_lucro || null,
                  custoKm: settings.custo_km || 0.5,
                  custoHora: settings.custo_hora || 20,
                };

                // Salvar localmente como cache
                await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configFromSupabase));
                logger.debug('✅ Configurações carregadas do Supabase');
                return configFromSupabase;
              }
            }
          }
        } catch (error) {
          logger.debug('Erro ao buscar configurações do Supabase, usando cache local:', error.message);
        }
      }

      // Fallback: buscar do AsyncStorage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      const defaultConfig = {
        // Parâmetros principais
        rsPorKmMinimo: 1.80,
        rsPorHoraMinimo: 25.00,
        distanciaMaxima: 10,
        tempoMaximoEstimado: 30,
        mediaKmPorLitro: 12,
        precoCombustivel: 6.00,
        perfilTrabalho: 'misto',
        // Parâmetros avançados
        distanciaMaximaCliente: 1.5,
        preferenciasApps: {
          uber: { preferido: false, evitar: false },
          '99': { preferido: false, evitar: false },
          ifood: { preferido: false, evitar: false },
        },
        metaDiariaLucro: null,
        // Compatibilidade com versão antiga
        custoKm: 0.5,
        custoHora: 20,
      };
      const configLocal = data ? JSON.parse(data) : {};
      logger.debug('Usando configurações do cache local');
      return { ...defaultConfig, ...configLocal };
    } catch (error) {
      logger.error('Erro ao buscar configurações:', error);
      return {
        rsPorKmMinimo: 1.80,
        rsPorHoraMinimo: 25.00,
        distanciaMaxima: 10,
        tempoMaximoEstimado: 30,
        mediaKmPorLitro: 12,
        precoCombustivel: 6.00,
        perfilTrabalho: 'misto',
        distanciaMaximaCliente: 1.5,
        preferenciasApps: {
          uber: { preferido: false, evitar: false },
          '99': { preferido: false, evitar: false },
          ifood: { preferido: false, evitar: false },
        },
        metaDiariaLucro: null,
        custoKm: 0.5,
        custoHora: 20,
      };
    }
  },

  async saveConfig(config) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return false;
    }
  },

  // Sincronização de dados locais com Supabase
  async syncLocalDataToSupabase() {
    try {
      if (!(await isAuthenticated())) {
        logger.debug('Usuário não autenticado, pulando sincronização');
        return { success: true, synced: 0 };
      }

      let synced = 0;

      // Sincronizar corridas locais que não têm ID do Supabase
      try {
        const corridasLocais = await AsyncStorage.getItem(STORAGE_KEYS.CORRIDAS);
        if (corridasLocais) {
          const corridas = JSON.parse(corridasLocais);
          const corridasParaSincronizar = corridas.filter(c => !c.id || c.id.toString().length < 36); // IDs do Supabase são UUIDs (36 caracteres)
          
          for (const corrida of corridasParaSincronizar) {
            try {
              await SupabaseService.saveCorrida(corrida);
              synced++;
              logger.debug('Corrida sincronizada:', corrida.id);
            } catch (error) {
              logger.warn('Erro ao sincronizar corrida:', error.message);
            }
          }
        }
      } catch (error) {
        logger.warn('Erro ao sincronizar corridas:', error.message);
      }

      // Sincronizar despesas locais que não têm ID do Supabase
      try {
        const despesasLocais = await AsyncStorage.getItem(STORAGE_KEYS.DESPESAS);
        if (despesasLocais) {
          const despesas = JSON.parse(despesasLocais);
          const despesasParaSincronizar = despesas.filter(d => !d.id || d.id.toString().length < 36);
          
          for (const despesa of despesasParaSincronizar) {
            try {
              await SupabaseService.saveDespesa(despesa);
              synced++;
              logger.debug('Despesa sincronizada:', despesa.id);
            } catch (error) {
              logger.warn('Erro ao sincronizar despesa:', error.message);
            }
          }
        }
      } catch (error) {
        logger.warn('Erro ao sincronizar despesas:', error.message);
      }

      if (synced > 0) {
        logger.debug(`Sincronização concluída: ${synced} itens sincronizados`);
        // Recarregar dados do Supabase após sincronização
        await this.getCorridas();
        await this.getDespesas();
      }

      return { success: true, synced };
    } catch (error) {
      logger.error('Erro na sincronização:', error);
      return { success: false, error: error.message, synced: 0 };
    }
  },

  // Métodos genéricos para armazenamento
  async getItem(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data;
    } catch (error) {
      logger.error(`Erro ao buscar item ${key}:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      logger.error(`Erro ao salvar item ${key}:`, error);
      return false;
    }
  },
};

