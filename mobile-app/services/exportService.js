import { StorageService } from './storage';
import { Formatters } from '../utils/formatters';
import * as FileSystem from 'expo-file-system';

export const ExportService = {
  /**
   * Exporta corridas e despesas em formato CSV
   */
  async exportToCSV(tipo = 'todos') {
    try {
      let dados = [];
      let headers = [];
      let filename = '';

      if (tipo === 'corridas' || tipo === 'todos') {
        const corridas = await StorageService.getCorridas();
        if (corridas.length > 0) {
          headers = ['Data', 'Hora', 'Plataforma', 'Valor (R$)', 'Distância (km)', 'Tempo (min)', 'Origem', 'Destino'];
          dados = corridas.map(c => [
            new Date(c.createdAt).toLocaleDateString('pt-BR'),
            new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            c.plataforma || 'N/A',
            Formatters.currency(c.valor || 0).replace('R$', '').trim(),
            (c.distancia || 0).toString().replace('.', ','),
            (c.tempoEstimado || 0).toString(),
            c.origem || 'N/A',
            c.destino || 'N/A',
          ]);
        }
        filename = tipo === 'corridas' ? 'corridas' : 'dados';
      }

      if (tipo === 'despesas' || tipo === 'todos') {
        const despesas = await StorageService.getDespesas();
        if (despesas.length > 0) {
          if (tipo === 'todos' && dados.length > 0) {
            // Adicionar separador
            dados.push([]);
            dados.push(['=== DESPESAS ===']);
            dados.push([]);
          }
          
          const despesaHeaders = ['Data', 'Hora', 'Tipo', 'Descrição', 'Valor (R$)'];
          if (tipo === 'despesas') {
            headers = despesaHeaders;
            dados = [];
          }
          
          dados.push(despesaHeaders);
          despesas.forEach(d => {
            dados.push([
              new Date(d.createdAt).toLocaleDateString('pt-BR'),
              new Date(d.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              d.tipo || 'N/A',
              d.descricao || 'N/A',
              Formatters.currency(d.valor || 0).replace('R$', '').trim(),
            ]);
          });
        }
        if (filename === '') filename = 'despesas';
      }

      // Criar conteúdo CSV
      const csvContent = [
        headers.join(';'),
        ...dados.map(row => row.join(';'))
      ].join('\n');

      // Salvar arquivo
      const fileUri = `${FileSystem.documentDirectory}${filename}_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return {
        success: true,
        fileUri,
        filename: `${filename}_${Date.now()}.csv`,
        mimeType: 'text/csv',
      };
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Gera um resumo em texto para envio via WhatsApp
   */
  async generateTextSummary(tipo = 'todos', periodo = 'mes') {
    try {
      const corridas = await StorageService.getCorridas();
      const despesas = await StorageService.getDespesas();
      
      // Filtrar por período
      const hoje = new Date();
      let dataInicio = new Date();
      
      if (periodo === 'hoje') {
        dataInicio.setHours(0, 0, 0, 0);
      } else if (periodo === 'semana') {
        dataInicio.setDate(hoje.getDate() - 7);
      } else if (periodo === 'mes') {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }

      let texto = '📊 *Relatório DriverFlow*\n\n';

      if (tipo === 'corridas' || tipo === 'todos') {
        const corridasFiltradas = corridas.filter(c => new Date(c.createdAt) >= dataInicio);
        const totalCorridas = corridasFiltradas.length;
        const totalReceita = corridasFiltradas.reduce((sum, c) => sum + (c.valor || 0), 0);
        const totalKm = corridasFiltradas.reduce((sum, c) => sum + (c.distancia || 0), 0);
        const ticketMedio = totalCorridas > 0 ? totalReceita / totalCorridas : 0;

        texto += `🚗 *CORRIDAS*\n`;
        texto += `Total: ${totalCorridas}\n`;
        texto += `Receita: ${Formatters.currency(totalReceita)}\n`;
        texto += `Ticket Médio: ${Formatters.currency(ticketMedio)}\n`;
        texto += `Total KM: ${totalKm.toFixed(2)} km\n\n`;
      }

      if (tipo === 'despesas' || tipo === 'todos') {
        const despesasFiltradas = despesas.filter(d => new Date(d.createdAt) >= dataInicio);
        const totalDespesas = despesasFiltradas.length;
        const totalGasto = despesasFiltradas.reduce((sum, d) => sum + (d.valor || 0), 0);

        texto += `💰 *DESPESAS*\n`;
        texto += `Total: ${totalDespesas}\n`;
        texto += `Gasto Total: ${Formatters.currency(totalGasto)}\n\n`;
      }

      if (tipo === 'todos') {
        const corridasFiltradas = corridas.filter(c => new Date(c.createdAt) >= dataInicio);
        const despesasFiltradas = despesas.filter(d => new Date(d.createdAt) >= dataInicio);
        const receita = corridasFiltradas.reduce((sum, c) => sum + (c.valor || 0), 0);
        const gasto = despesasFiltradas.reduce((sum, d) => sum + (d.valor || 0), 0);
        const lucro = receita - gasto;

        texto += `📈 *RESUMO*\n`;
        texto += `Receita: ${Formatters.currency(receita)}\n`;
        texto += `Despesas: ${Formatters.currency(gasto)}\n`;
        texto += `Lucro: ${Formatters.currency(lucro)}\n`;
      }

      texto += `\n📅 Período: ${this.getPeriodoLabel(periodo)}\n`;
      texto += `📱 DriverFlow v1.0.0`;

      return {
        success: true,
        texto,
      };
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getPeriodoLabel(periodo) {
    const labels = {
      hoje: 'Hoje',
      semana: 'Últimos 7 dias',
      mes: 'Este mês',
    };
    return labels[periodo] || periodo;
  },

  /**
   * Prepara dados para envio via WhatsApp
   */
  async prepareForWhatsApp(tipo = 'todos', formato = 'texto', periodo = 'mes') {
    try {
      if (formato === 'texto') {
        return await this.generateTextSummary(tipo, periodo);
      } else if (formato === 'csv') {
        const csvResult = await this.exportToCSV(tipo);
        if (csvResult.success) {
          return {
            success: true,
            fileUri: csvResult.fileUri,
            filename: csvResult.filename,
            mimeType: csvResult.mimeType,
            tipo: 'arquivo',
          };
        }
        return csvResult;
      }
      
      return {
        success: false,
        error: 'Formato não suportado',
      };
    } catch (error) {
      console.error('Erro ao preparar dados para WhatsApp:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

