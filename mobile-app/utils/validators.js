/**
 * Utilitários de validação de formulários
 */

export const Validators = {
  /**
   * Valida se um valor monetário é válido
   */
  isValidMoney(value) {
    if (!value || value.trim() === '') return false;
    const numValue = parseFloat(value.replace(',', '.').replace(/[^\d.,]/g, ''));
    return !isNaN(numValue) && numValue > 0;
  },

  /**
   * Valida se um número é válido e positivo
   */
  isValidNumber(value) {
    if (!value || value.trim() === '') return false;
    const numValue = parseFloat(value.replace(',', '.'));
    return !isNaN(numValue) && numValue > 0;
  },

  /**
   * Valida se um campo de texto não está vazio
   */
  isNotEmpty(value) {
    return value && value.trim().length > 0;
  },

  /**
   * Valida email (se necessário no futuro)
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida formulário de corrida
   */
  validateCorrida(data) {
    const errors = {};
    
    if (!Validators.isValidMoney(data.valor)) {
      errors.valor = 'Valor inválido';
    }
    
    if (!Validators.isValidNumber(data.distancia)) {
      errors.distancia = 'Distância inválida';
    }
    
    if (!Validators.isValidNumber(data.tempoEstimado)) {
      errors.tempoEstimado = 'Tempo estimado inválido';
    }
    
    if (!data.plataforma) {
      errors.plataforma = 'Selecione uma plataforma';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Valida formulário de despesa
   */
  validateDespesa(data) {
    const errors = {};
    
    if (!Validators.isValidMoney(data.valor)) {
      errors.valor = 'Valor inválido';
    }
    
    if (!Validators.isNotEmpty(data.descricao)) {
      errors.descricao = 'Descrição é obrigatória';
    }
    
    if (!data.tipo) {
      errors.tipo = 'Selecione um tipo de despesa';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

