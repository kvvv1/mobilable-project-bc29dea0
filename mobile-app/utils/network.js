/**
 * Utilitários para verificação de conexão de rede
 */

import NetInfo from '@react-native-community/netinfo';

/**
 * Verifica se há conexão com a internet
 * @returns {Promise<boolean>}
 */
export const checkConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    // Se houver erro ao verificar, assumir que não há conexão
    return false;
  }
};

/**
 * Verifica o tipo de conexão (wifi, cellular, etc)
 * @returns {Promise<string>}
 */
export const getConnectionType = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.type || 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Verifica se está conectado via WiFi
 * @returns {Promise<boolean>}
 */
export const isWifiConnected = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi' && (state.isConnected ?? false);
  } catch (error) {
    return false;
  }
};

/**
 * Listener de mudanças de conexão
 * @param {Function} callback - Função chamada quando a conexão muda
 * @returns {Function} Função para remover o listener
 */
export const addConnectionListener = (callback) => {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false, state.type);
  });
};


