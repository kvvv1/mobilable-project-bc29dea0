import Constants from 'expo-constants';
import { supabase } from './authService';
import { logger } from '../utils/logger';

// URL da API do backend
const getApiUrl = () => {
  // Tentar obter da variável de ambiente primeiro
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') return envUrl.trim();
  
  // Tentar do app.config.js
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl && configUrl.trim() !== '') return configUrl.trim();
  
  // Se não houver URL configurada, retornar null
  // Isso fará com que o código use apenas dados locais (fallback)
  return null;
};

// Obter token de autenticação
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    logger.error('Erro ao obter token:', error);
    return null;
  }
};

// Função auxiliar para fazer requisições autenticadas
const apiRequest = async (endpoint, options = {}) => {
  try {
    const apiUrl = getApiUrl();
    
    // Se não houver URL configurada, lançar erro silencioso
    if (!apiUrl) {
      throw new Error('API_URL_NOT_CONFIGURED');
    }
    
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const url = `${apiUrl}${endpoint}`;
    
    // Timeout de 5 segundos para evitar travamentos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || errorData.message || `Erro HTTP ${response.status}`);
      }

      return await response.json();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw fetchError;
    }
  } catch (error) {
    // Não logar erros de rede como erro crítico - é esperado se o backend não estiver rodando
    if (error.message === 'API_URL_NOT_CONFIGURED' || 
        error.message === 'Network request failed' ||
        error.message === 'TIMEOUT' ||
        error.message.includes('Network')) {
      logger.debug(`Backend não disponível (${endpoint}):`, error.message);
      throw error; // Re-lançar para que o código chamador possa tratar
    }
    logger.error(`Erro na requisição ${endpoint}:`, error);
    throw error;
  }
};

export const ApiService = {
  // ========== CORRIDAS ==========
  
  /**
   * Buscar corridas do Supabase
   */
  async getCorridas(filters = {}) {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        logger.debug('API URL não configurada, retornando array vazio');
        return [];
      }
      
      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.plataforma) queryParams.append('plataforma', filters.plataforma);

      const queryString = queryParams.toString();
      const endpoint = `/api/corridas${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest(endpoint);
      return result.corridas || [];
    } catch (error) {
      // Erros de rede são esperados se o backend não estiver rodando
      if (error.message === 'API_URL_NOT_CONFIGURED' || 
          error.message === 'Network request failed' ||
          error.message === 'TIMEOUT' ||
          error.message.includes('Network')) {
        logger.debug('Backend não disponível para buscar corridas');
        return [];
      }
      logger.error('Erro ao buscar corridas:', error);
      return [];
    }
  },

  /**
   * Salvar corrida no Supabase
   */
  async saveCorrida(corrida) {
    try {
      // Preparar dados para a API
      const corridaData = {
        plataforma: corrida.plataforma,
        valor: parseFloat(corrida.valor),
        distancia: parseFloat(corrida.distancia),
        tempo_estimado: parseInt(corrida.tempoEstimado || corrida.tempo_estimado || 0),
        origem: corrida.origem || null,
        destino: corrida.destino || null,
        imagem_url: corrida.imagem_url || corrida.imagem || null,
        vehicle_id: corrida.vehicle_id || null,
        data_corrida: corrida.data_corrida || corrida.createdAt || new Date().toISOString(),
      };

      // Se tiver análise, incluir os dados calculados
      if (corrida.analise) {
        corridaData.custo_combustivel = corrida.analise.custoCombustivel || corrida.analise.custo_combustivel;
        corridaData.custo_desgaste = corrida.analise.custoDesgaste || corrida.analise.custo_desgaste;
        corridaData.custo_tempo = corrida.analise.custoTempo || corrida.analise.custo_tempo;
        corridaData.custo_total = corrida.analise.custoTotal || corrida.analise.custo_total;
        corridaData.lucro_liquido = corrida.analise.lucroLiquido || corrida.analise.lucro_liquido;
        corridaData.margem_lucro = corrida.analise.margemLucro || corrida.analise.margem_lucro;
        corridaData.valor_por_km = corrida.analise.valorPorKm || corrida.analise.valor_por_km;
        corridaData.valor_por_hora = corrida.analise.valorPorHora || corrida.analise.valor_por_hora;
        corridaData.score = corrida.analise.score;
        corridaData.viabilidade = corrida.analise.viabilidade;
        corridaData.recomendacao = corrida.analise.recomendacao;
      }

      const result = await apiRequest('/api/corridas', {
        method: 'POST',
        body: JSON.stringify(corridaData),
      });

      return result.corrida;
    } catch (error) {
      logger.error('Erro ao salvar corrida:', error);
      throw error;
    }
  },

  /**
   * Atualizar corrida no Supabase
   */
  async updateCorrida(id, corrida) {
    try {
      const corridaData = {
        plataforma: corrida.plataforma,
        valor: corrida.valor,
        distancia: corrida.distancia,
        tempo_estimado: corrida.tempoEstimado || corrida.tempo_estimado,
        origem: corrida.origem || null,
        destino: corrida.destino || null,
        imagem_url: corrida.imagem_url || corrida.imagem || null,
        vehicle_id: corrida.vehicle_id || null,
      };

      const result = await apiRequest(`/api/corridas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(corridaData),
      });

      return result.corrida;
    } catch (error) {
      logger.error('Erro ao atualizar corrida:', error);
      throw error;
    }
  },

  /**
   * Deletar corrida no Supabase
   */
  async deleteCorrida(id) {
    try {
      await apiRequest(`/api/corridas/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      logger.error('Erro ao deletar corrida:', error);
      throw error;
    }
  },

  /**
   * Buscar estatísticas de corridas
   */
  async getCorridasStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const queryString = queryParams.toString();
      const endpoint = `/api/corridas/stats${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest(endpoint);
      return result.stats || {};
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      return {};
    }
  },

  // ========== DESPESAS ==========

  /**
   * Buscar despesas do Supabase
   */
  async getDespesas(filters = {}) {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        logger.debug('API URL não configurada, retornando array vazio');
        return [];
      }
      
      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.tipo) queryParams.append('tipo', filters.tipo);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const queryString = queryParams.toString();
      const endpoint = `/api/despesas${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest(endpoint);
      return result.despesas || [];
    } catch (error) {
      // Erros de rede são esperados se o backend não estiver rodando
      if (error.message === 'API_URL_NOT_CONFIGURED' || 
          error.message === 'Network request failed' ||
          error.message === 'TIMEOUT' ||
          error.message.includes('Network')) {
        logger.debug('Backend não disponível para buscar despesas');
        return [];
      }
      logger.error('Erro ao buscar despesas:', error);
      return [];
    }
  },

  /**
   * Salvar despesa no Supabase
   */
  async saveDespesa(despesa) {
    try {
      const despesaData = {
        tipo: despesa.tipo,
        valor: despesa.valor,
        descricao: despesa.descricao || null,
        vehicle_id: despesa.vehicle_id || null,
        data_despesa: despesa.data_despesa || despesa.createdAt || new Date().toISOString(),
      };

      const result = await apiRequest('/api/despesas', {
        method: 'POST',
        body: JSON.stringify(despesaData),
      });

      return result.despesa;
    } catch (error) {
      logger.error('Erro ao salvar despesa:', error);
      throw error;
    }
  },

  /**
   * Atualizar despesa no Supabase
   */
  async updateDespesa(id, despesa) {
    try {
      const despesaData = {
        tipo: despesa.tipo,
        valor: despesa.valor,
        descricao: despesa.descricao || null,
        vehicle_id: despesa.vehicle_id || null,
      };

      const result = await apiRequest(`/api/despesas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(despesaData),
      });

      return result.despesa;
    } catch (error) {
      logger.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  },

  /**
   * Deletar despesa no Supabase
   */
  async deleteDespesa(id) {
    try {
      await apiRequest(`/api/despesas/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      logger.error('Erro ao deletar despesa:', error);
      throw error;
    }
  },

  /**
   * Buscar estatísticas de despesas
   */
  async getDespesasStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const queryString = queryParams.toString();
      const endpoint = `/api/despesas/stats${queryString ? `?${queryString}` : ''}`;
      
      const result = await apiRequest(endpoint);
      return result.stats || {};
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de despesas:', error);
      return {};
    }
  },
};

export default ApiService;

