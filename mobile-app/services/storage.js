import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CORRIDAS: 'corridas',
  DESPESAS: 'despesas',
  CONFIG: 'config',
};

export const StorageService = {
  // Corridas
  async getCorridas() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CORRIDAS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao buscar corridas:', error);
      return [];
    }
  },

  async saveCorrida(corrida) {
    try {
      const corridas = await this.getCorridas();
      const novaCorrida = {
        ...corrida,
        id: corrida.id || Date.now().toString(),
        createdAt: corrida.createdAt || new Date().toISOString(),
      };
      corridas.push(novaCorrida);
      await AsyncStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(corridas));
      return novaCorrida;
    } catch (error) {
      console.error('Erro ao salvar corrida:', error);
      throw error;
    }
  },

  async deleteCorrida(id) {
    try {
      const corridas = await this.getCorridas();
      const filtered = corridas.filter(c => c.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.CORRIDAS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Erro ao deletar corrida:', error);
      return false;
    }
  },

  // Despesas
  async getDespesas() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DESPESAS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      return [];
    }
  },

  async saveDespesa(despesa) {
    try {
      const despesas = await this.getDespesas();
      const novaDespesa = {
        ...despesa,
        id: despesa.id || Date.now().toString(),
        createdAt: despesa.createdAt || new Date().toISOString(),
      };
      despesas.push(novaDespesa);
      await AsyncStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesas));
      return novaDespesa;
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      throw error;
    }
  },

  async deleteDespesa(id) {
    try {
      const despesas = await this.getDespesas();
      const filtered = despesas.filter(d => d.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      return false;
    }
  },

  // Configurações
  async getConfig() {
    try {
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
      return data ? { ...defaultConfig, ...JSON.parse(data) } : defaultConfig;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {};
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

  // Métodos genéricos para armazenamento
  async getItem(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data;
    } catch (error) {
      console.error(`Erro ao buscar item ${key}:`, error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar item ${key}:`, error);
      return false;
    }
  },
};

