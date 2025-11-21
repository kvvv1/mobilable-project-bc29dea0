import { StorageService } from './storage';

const TEMPLATES_KEY = 'despesa_templates';

export const TemplatesService = {
  /**
   * Busca todos os templates salvos
   */
  async getTemplates() {
    try {
      const data = await StorageService.getItem(TEMPLATES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      return [];
    }
  },

  /**
   * Salva um novo template
   */
  async saveTemplate(template) {
    try {
      const templates = await this.getTemplates();
      const novoTemplate = {
        ...template,
        id: template.id || Date.now().toString(),
        createdAt: template.createdAt || new Date().toISOString(),
        usado: template.usado || 0,
      };
      templates.push(novoTemplate);
      await StorageService.setItem(TEMPLATES_KEY, JSON.stringify(templates));
      return novoTemplate;
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      throw error;
    }
  },

  /**
   * Deleta um template
   */
  async deleteTemplate(id) {
    try {
      const templates = await this.getTemplates();
      const filtered = templates.filter(t => t.id !== id);
      await StorageService.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      return false;
    }
  },

  /**
   * Incrementa contador de uso do template
   */
  async incrementarUso(id) {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === id);
      if (template) {
        template.usado = (template.usado || 0) + 1;
        template.lastUsed = new Date().toISOString();
        await StorageService.setItem(TEMPLATES_KEY, JSON.stringify(templates));
      }
    } catch (error) {
      console.error('Erro ao incrementar uso:', error);
    }
  },

  /**
   * Busca templates mais usados
   */
  async getTemplatesMaisUsados(limit = 5) {
    try {
      const templates = await this.getTemplates();
      return templates
        .sort((a, b) => (b.usado || 0) - (a.usado || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar templates mais usados:', error);
      return [];
    }
  },
};

