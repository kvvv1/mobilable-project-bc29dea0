import { StorageService } from './storage';

export const AnaliseService = {
  // Analisa se uma corrida compensa baseado em parâmetros
  analisarViabilidade(corrida, config) {
    const {
      valor,
      distancia = 0,
      tempoEstimado = 0,
      plataforma = 'uber',
    } = corrida;

    const {
      custoKm = 0.5,
      custoHora = 20,
      mediaKmPorLitro = 12,
      precoCombustivel = 5.5,
    } = config;

    // Calcular custos
    const custoCombustivel = (distancia / mediaKmPorLitro) * precoCombustivel;
    const custoDesgaste = distancia * custoKm;
    const custoTempo = (tempoEstimado / 60) * custoHora;
    const custoTotal = custoCombustivel + custoDesgaste + custoTempo;

    // Lucro líquido
    const lucroLiquido = valor - custoTotal;
    const margemLucro = valor > 0 ? (lucroLiquido / valor) * 100 : 0;

    // Análise de viabilidade
    let viabilidade = 'ruim';
    let recomendacao = 'Não compensa';

    if (margemLucro > 50) {
      viabilidade = 'excelente';
      recomendacao = 'Corrida muito lucrativa! Aceite!';
    } else if (margemLucro > 30) {
      viabilidade = 'boa';
      recomendacao = 'Corrida compensa! Boa margem.';
    } else if (margemLucro > 15) {
      viabilidade = 'razoavel';
      recomendacao = 'Pode aceitar, mas não é ideal.';
    } else if (margemLucro > 0) {
      viabilidade = 'ruim';
      recomendacao = 'Lucro baixo, considere rejeitar.';
    } else {
      viabilidade = 'pessima';
      recomendacao = 'Não compensa! Prejuízo garantido.';
    }

    // Indicadores adicionais
    const valorPorKm = distancia > 0 ? valor / distancia : 0;
    const valorPorHora = tempoEstimado > 0 ? (valor / tempoEstimado) * 60 : 0;

    return {
      custoCombustivel: parseFloat(custoCombustivel.toFixed(2)),
      custoDesgaste: parseFloat(custoDesgaste.toFixed(2)),
      custoTempo: parseFloat(custoTempo.toFixed(2)),
      custoTotal: parseFloat(custoTotal.toFixed(2)),
      lucroLiquido: parseFloat(lucroLiquido.toFixed(2)),
      margemLucro: parseFloat(margemLucro.toFixed(2)),
      valorPorKm: parseFloat(valorPorKm.toFixed(2)),
      valorPorHora: parseFloat(valorPorHora.toFixed(2)),
      viabilidade,
      recomendacao,
    };
  },

  // Calcula estatísticas gerais
  async calcularEstatisticas() {
    const corridas = await StorageService.getCorridas();
    const despesas = await StorageService.getDespesas();
    const config = await StorageService.getConfig();

    if (corridas.length === 0) {
      return {
        totalReceitas: 0,
        totalDespesas: 0,
        lucroLiquido: 0,
        totalCorridas: 0,
        totalKm: 0,
        valorMedio: 0,
        melhorHorario: null,
        melhorPlataforma: null,
        corridasHoje: 0,
      };
    }

    // Período (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    const corridasRecentes = corridas.filter(c => {
      const data = new Date(c.createdAt);
      return data >= trintaDiasAtras;
    });

    const despesasRecentes = despesas.filter(d => {
      const data = new Date(d.createdAt);
      return data >= trintaDiasAtras;
    });

    // Totais
    const totalReceitas = corridasRecentes.reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalDespesas = despesasRecentes.reduce((sum, d) => sum + (d.valor || 0), 0);
    const lucroLiquido = totalReceitas - totalDespesas;

    // Estatísticas de corridas
    const totalKm = corridasRecentes.reduce((sum, c) => sum + (c.distancia || 0), 0);
    const valorMedio = corridasRecentes.length > 0 ? totalReceitas / corridasRecentes.length : 0;

    // Melhor horário
    const horarios = {};
    corridasRecentes.forEach(c => {
      const hora = new Date(c.createdAt).getHours();
      const range = `${Math.floor(hora / 4) * 4}h-${Math.floor(hora / 4) * 4 + 4}h`;
      if (!horarios[range]) {
        horarios[range] = { total: 0, count: 0 };
      }
      horarios[range].total += c.valor || 0;
      horarios[range].count += 1;
    });

    let melhorHorario = null;
    let melhorMedia = 0;
    Object.entries(horarios).forEach(([range, data]) => {
      const media = data.total / data.count;
      if (media > melhorMedia) {
        melhorMedia = media;
        melhorHorario = range;
      }
    });

    // Melhor plataforma
    const plataformas = {};
    corridasRecentes.forEach(c => {
      const plataforma = c.plataforma || 'outros';
      if (!plataformas[plataforma]) {
        plataformas[plataforma] = { total: 0, count: 0 };
      }
      plataformas[plataforma].total += c.valor || 0;
      plataformas[plataforma].count += 1;
    });

    let melhorPlataforma = null;
    let melhorMediaPlataforma = 0;
    Object.entries(plataformas).forEach(([plataforma, data]) => {
      const media = data.total / data.count;
      if (media > melhorMediaPlataforma) {
        melhorMediaPlataforma = media;
        melhorPlataforma = plataforma;
      }
    });

    // Corridas hoje
    const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0));
    const corridasHoje = corridas.filter(c => new Date(c.createdAt) >= inicioHoje).length;

    return {
      totalReceitas: parseFloat(totalReceitas.toFixed(2)),
      totalDespesas: parseFloat(totalDespesas.toFixed(2)),
      lucroLiquido: parseFloat(lucroLiquido.toFixed(2)),
      totalCorridas: corridasRecentes.length,
      totalKm: parseFloat(totalKm.toFixed(2)),
      valorMedio: parseFloat(valorMedio.toFixed(2)),
      melhorHorario,
      melhorPlataforma,
      corridasHoje,
      margemLucro: totalReceitas > 0 ? parseFloat(((lucroLiquido / totalReceitas) * 100).toFixed(2)) : 0,
    };
  },
};

export default AnaliseService;

