/**
 * Logger condicional - apenas loga em desenvolvimento
 * Em produção, os logs são silenciados para melhor performance e segurança
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Log de informações gerais
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log de erros (sempre loga, mas apenas em dev mostra detalhes)
   */
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    }
    // Em produção, você pode enviar para um serviço de crash reporting
    // Ex: Sentry.captureException(args[0]);
  },

  /**
   * Log de avisos
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log de informações de debug (apenas em dev)
   */
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log de informações importantes (sempre loga)
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

export default logger;


