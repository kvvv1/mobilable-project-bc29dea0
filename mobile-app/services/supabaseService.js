import { supabase } from './authService';
import { logger } from '../utils/logger';
import AnaliseService from './analiseCorridas';
import { StorageService } from './storage';

/**
 * Serviço para comunicação direta com Supabase
 * Funciona de qualquer lugar, sem precisar de backend ou mesma rede Wi-Fi
 */
export const SupabaseService = {
  // ========== CORRIDAS ==========
  
  /**
   * Buscar corridas do Supabase diretamente
   */
  async getCorridas(filters = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.debug('Usuário não autenticado, retornando array vazio');
        return [];
      }

      // Buscar perfil do usuário para obter organization_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_organization_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.current_organization_id) {
        logger.debug('Usuário não tem organização, retornando array vazio');
        return [];
      }

      let query = supabase
        .from('corridas')
        .select('*, vehicle:vehicles(*)')
        .eq('organization_id', profile.current_organization_id)
        .is('deleted_at', null)
        .order('data_corrida', { ascending: false });

      // Aplicar filtros
      if (filters.start_date) {
        query = query.gte('data_corrida', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('data_corrida', filters.end_date);
      }
      if (filters.plataforma) {
        query = query.eq('plataforma', filters.plataforma);
      }
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      const { data: corridas, error } = await query;

      if (error) {
        logger.error('Erro ao buscar corridas do Supabase:', error);
        return [];
      }

      return corridas || [];
    } catch (error) {
      logger.error('Erro ao buscar corridas:', error);
      return [];
    }
  },

  /**
   * Salvar corrida no Supabase diretamente
   */
  async saveCorrida(corrida) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar perfil do usuário para obter organization_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_organization_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.current_organization_id) {
        throw new Error('Usuário não tem organização. Complete o onboarding primeiro.');
      }

      // Buscar configurações para calcular análise
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', profile.current_organization_id)
        .single();

      // Calcular análise usando o serviço local
      const config = settings || await StorageService.getConfig();
      const analise = AnaliseService.analisarViabilidade({
        plataforma: corrida.plataforma,
        valor: corrida.valor,
        distancia: corrida.distancia,
        tempoEstimado: corrida.tempoEstimado || corrida.tempo_estimado,
      }, config);

      // Preparar dados para inserção
      const corridaData = {
        organization_id: profile.current_organization_id,
        user_id: session.user.id,
        vehicle_id: corrida.vehicle_id || null,
        plataforma: corrida.plataforma,
        valor: parseFloat(corrida.valor),
        distancia: parseFloat(corrida.distancia),
        tempo_estimado: parseInt(corrida.tempoEstimado || corrida.tempo_estimado || 0),
        origem: corrida.origem || null,
        destino: corrida.destino || null,
        imagem_url: corrida.imagem_url || corrida.imagem || null,
        data_corrida: corrida.data_corrida || corrida.createdAt || new Date().toISOString(),
        // Dados da análise
        custo_combustivel: parseFloat((analise.custoCombustivel || 0).toFixed(2)),
        custo_desgaste: parseFloat((analise.custoDesgaste || 0).toFixed(2)),
        custo_tempo: parseFloat((analise.custoTempo || 0).toFixed(2)),
        custo_total: parseFloat((analise.custoTotal || 0).toFixed(2)),
        lucro_liquido: parseFloat((analise.lucroLiquido || 0).toFixed(2)),
        margem_lucro: parseFloat((analise.margemLucro || 0).toFixed(2)),
        valor_por_km: parseFloat((analise.valorPorKm || 0).toFixed(2)),
        valor_por_hora: parseFloat((analise.valorPorHora || 0).toFixed(2)),
        score: parseFloat((analise.score || 0).toFixed(1)),
        viabilidade: analise.viabilidade || 'ruim',
        recomendacao: analise.recomendacao || 'Não compensa! Prejuízo garantido.',
      };

      const { data: corridaSalva, error } = await supabase
        .from('corridas')
        .insert(corridaData)
        .select('*, vehicle:vehicles(*)')
        .single();

      if (error) {
        logger.error('Erro ao salvar corrida no Supabase:', error);
        throw error;
      }

      return corridaSalva;
    } catch (error) {
      logger.error('Erro ao salvar corrida:', error);
      throw error;
    }
  },

  /**
   * Deletar corrida no Supabase (soft delete)
   */
  async deleteCorrida(id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('corridas')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        logger.error('Erro ao deletar corrida:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Erro ao deletar corrida:', error);
      throw error;
    }
  },

  // ========== DESPESAS ==========

  /**
   * Buscar despesas do Supabase diretamente
   */
  async getDespesas(filters = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        logger.debug('Usuário não autenticado, retornando array vazio');
        return [];
      }

      // Buscar perfil do usuário para obter organization_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_organization_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.current_organization_id) {
        logger.debug('Usuário não tem organização, retornando array vazio');
        return [];
      }

      let query = supabase
        .from('despesas')
        .select('*, vehicle:vehicles(*)')
        .eq('organization_id', profile.current_organization_id)
        .is('deleted_at', null)
        .order('data_despesa', { ascending: false });

      // Aplicar filtros
      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters.start_date) {
        query = query.gte('data_despesa', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('data_despesa', filters.end_date);
      }
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      const { data: despesas, error } = await query;

      if (error) {
        logger.error('Erro ao buscar despesas do Supabase:', error);
        return [];
      }

      return despesas || [];
    } catch (error) {
      logger.error('Erro ao buscar despesas:', error);
      return [];
    }
  },

  /**
   * Salvar despesa no Supabase diretamente
   */
  async saveDespesa(despesa) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar perfil do usuário para obter organization_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_organization_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.current_organization_id) {
        throw new Error('Usuário não tem organização. Complete o onboarding primeiro.');
      }

      // Preparar dados para inserção
      const despesaData = {
        organization_id: profile.current_organization_id,
        user_id: session.user.id,
        vehicle_id: despesa.vehicle_id || null,
        tipo: despesa.tipo,
        valor: parseFloat(despesa.valor),
        descricao: despesa.descricao || null,
        data_despesa: despesa.data_despesa || despesa.createdAt || new Date().toISOString(),
      };

      const { data: despesaSalva, error } = await supabase
        .from('despesas')
        .insert(despesaData)
        .select('*, vehicle:vehicles(*)')
        .single();

      if (error) {
        logger.error('Erro ao salvar despesa no Supabase:', error);
        throw error;
      }

      return despesaSalva;
    } catch (error) {
      logger.error('Erro ao salvar despesa:', error);
      throw error;
    }
  },

  /**
   * Deletar despesa no Supabase (soft delete)
   */
  async deleteDespesa(id) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('despesas')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        logger.error('Erro ao deletar despesa:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Erro ao deletar despesa:', error);
      throw error;
    }
  },
};

export default SupabaseService;

