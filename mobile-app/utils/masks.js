/**
 * Utilitários de máscara de entrada para campos de formulário
 */

export const Masks = {
  /**
   * Formata valor monetário enquanto o usuário digita
   * Ex: "1234" -> "12,34" -> "R$ 12,34"
   */
  money(value) {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para centavos e depois para reais
    const cents = parseInt(numbers, 10);
    const reais = cents / 100;
    
    // Formata com 2 casas decimais
    return reais.toFixed(2).replace('.', ',');
  },

  /**
   * Formata número decimal (para distância, etc)
   * Ex: "1234" -> "12,34"
   */
  decimal(value, decimals = 1) {
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    const num = parseInt(numbers, 10);
    const decimal = num / Math.pow(10, decimals);
    
    return decimal.toFixed(decimals).replace('.', ',');
  },

  /**
   * Remove formatação e retorna número puro
   */
  unformatMoney(value) {
    return parseFloat(value.replace(',', '.').replace(/[^\d.,]/g, '')) || 0;
  },

  /**
   * Remove formatação e retorna número puro
   */
  unformatDecimal(value) {
    return parseFloat(value.replace(',', '.')) || 0;
  },
};


