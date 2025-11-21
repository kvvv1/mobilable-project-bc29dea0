import { StorageService } from './storage';

export const HistoryService = {
  /**
   * Busca últimas corridas para preenchimento rápido
   */
  async getUltimasCorridas(limit = 5) {
    try {
      const corridas = await StorageService.getCorridas();
      return corridas
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar últimas corridas:', error);
      return [];
    }
  },

  /**
   * Busca últimas despesas para preenchimento rápido
   */
  async getUltimasDespesas(limit = 5) {
    try {
      const despesas = await StorageService.getDespesas();
      return despesas
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar últimas despesas:', error);
      return [];
    }
  },

  /**
   * Busca despesas similares por tipo
   */
  async getDespesasSimilares(tipo, limit = 3) {
    try {
      const despesas = await StorageService.getDespesas();
      return despesas
        .filter(d => d.tipo === tipo)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar despesas similares:', error);
      return [];
    }
  },
};

