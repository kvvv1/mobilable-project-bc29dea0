import { ExportService } from './exportService';
import * as FileSystem from 'expo-file-system';

/**
 * Serviço para integração com Z-API
 * Documentação: https://developer.z-api.io/
 */
export const ZapiService = {
  /**
   * Envia mensagem de texto via WhatsApp usando Z-API
   * @param {string} instanceId - ID da instância do Z-API
   * @param {string} token - Token de autenticação do Z-API
   * @param {string} phoneNumber - Número do WhatsApp (formato: 5511999999999)
   * @param {string} message - Mensagem a ser enviada
   */
  async sendTextMessage(instanceId, token, phoneNumber, message) {
    try {
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: data.messageId || data.id,
          data,
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Erro ao enviar mensagem',
          data,
        };
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem via Z-API:', error);
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  },

  /**
   * Envia arquivo (documento/imagem) via WhatsApp usando Z-API
   * @param {string} instanceId - ID da instância do Z-API
   * @param {string} token - Token de autenticação do Z-API
   * @param {string} phoneNumber - Número do WhatsApp
   * @param {string} fileUrl - URL do arquivo ou base64
   * @param {string} filename - Nome do arquivo
   * @param {string} mimeType - Tipo MIME do arquivo (ex: text/csv, application/pdf)
   * @param {string} caption - Legenda opcional
   */
  async sendFile(instanceId, token, phoneNumber, fileUrl, filename, mimeType, caption = '') {
    try {
      // Se for base64, precisa converter para URL ou usar endpoint de upload
      let fileToSend = fileUrl;
      
      // Se for um arquivo local, precisa fazer upload primeiro ou converter para base64
      // Por enquanto, assumindo que fileUrl já está em formato adequado
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-document`;
      
      const body = {
        phone: phoneNumber,
        document: fileToSend,
        fileName: filename,
      };

      if (caption) {
        body.caption = caption;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: data.messageId || data.id,
          data,
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Erro ao enviar arquivo',
          data,
        };
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo via Z-API:', error);
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  },

  /**
   * Envia dados de corridas/despesas via WhatsApp
   * @param {object} config - Configuração com instanceId, token, phoneNumber
   * @param {string} tipo - 'corridas', 'despesas' ou 'todos'
   * @param {string} formato - 'texto' ou 'csv'
   * @param {string} periodo - 'hoje', 'semana' ou 'mes'
   */
  async sendDataToWhatsApp(config, tipo = 'todos', formato = 'texto', periodo = 'mes') {
    try {
      const { instanceId, token, phoneNumber } = config;

      if (!instanceId || !token || !phoneNumber) {
        return {
          success: false,
          error: 'Configuração incompleta. Verifique instanceId, token e phoneNumber.',
        };
      }

      // Preparar dados
      const dados = await ExportService.prepareForWhatsApp(tipo, formato, periodo);

      if (!dados.success) {
        return dados;
      }

      // Enviar
      if (formato === 'texto') {
        return await this.sendTextMessage(instanceId, token, phoneNumber, dados.texto);
      } else if (formato === 'csv') {
        // Para arquivo, precisa ler o arquivo e converter para base64 ou fazer upload
        // Por enquanto, vamos tentar enviar como documento
        const fileContent = await this.readFileAsBase64(dados.fileUri);
        
        return await this.sendFile(
          instanceId,
          token,
          phoneNumber,
          fileContent,
          dados.filename,
          dados.mimeType,
          `📊 Relatório ${tipo === 'todos' ? 'Completo' : tipo === 'corridas' ? 'de Corridas' : 'de Despesas'} - ${ExportService.getPeriodoLabel(periodo)}`
        );
      }

      return {
        success: false,
        error: 'Formato não suportado',
      };
    } catch (error) {
      console.error('Erro ao enviar dados via WhatsApp:', error);
      return {
        success: false,
        error: error.message || 'Erro ao enviar dados',
      };
    }
  },

  /**
   * Lê arquivo e converte para base64
   */
  async readFileAsBase64(fileUri) {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:application/octet-stream;base64,${fileContent}`;
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      throw error;
    }
  },

  /**
   * Valida configuração do Z-API
   */
  validateConfig(config) {
    const { instanceId, token, phoneNumber } = config;
    const errors = [];

    if (!instanceId || instanceId.trim() === '') {
      errors.push('Instance ID é obrigatório');
    }

    if (!token || token.trim() === '') {
      errors.push('Token é obrigatório');
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      errors.push('Número do WhatsApp é obrigatório');
    } else {
      // Validar formato do número (deve ter DDI + DDD + número)
      const phoneRegex = /^\d{10,15}$/;
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Número do WhatsApp inválido. Use formato: 5511999999999');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

