import { StorageService } from './storage';

export const AnaliseService = {
  // Analisa se uma corrida compensa baseado em parâmetros
  analisarViabilidade(corrida, config) {
    const {
      valor,
      distancia = 0,
      tempoEstimado = 0,
      plataforma = 'uber',
      distanciaAteCliente = 0,
    } = corrida;

    // Parâmetros principais (novos)
    const {
      rsPorKmMinimo = 1.80,
      rsPorHoraMinimo = 25.00,
      distanciaMaxima = 10,
      tempoMaximoEstimado = 30,
      mediaKmPorLitro = 12,
      precoCombustivel = 6.00,
      perfilTrabalho = 'misto',
      // Parâmetros avançados
      distanciaMaximaCliente = 1.5,
      preferenciasApps = {},
      // Compatibilidade com versão antiga
      custoKm = 0.5,
      custoHora = 20,
    } = config;

    // Verificações de limites básicos
    const excedeDistanciaMaxima = distancia > distanciaMaxima;
    const excedeTempoMaximo = tempoEstimado > tempoMaximoEstimado;
    const excedeDistanciaCliente = distanciaAteCliente > distanciaMaximaCliente;

    // Calcular custos
    const custoCombustivel = (distancia / mediaKmPorLitro) * precoCombustivel;
    const custoDesgaste = distancia * (custoKm || 0.5); // Usa custoKm se disponível
    const custoTempo = (tempoEstimado / 60) * (custoHora || 20); // Usa custoHora se disponível
    const custoTotal = custoCombustivel + custoDesgaste + custoTempo;

    // Lucro líquido
    const lucroLiquido = valor - custoTotal;
    const margemLucro = valor > 0 ? (lucroLiquido / valor) * 100 : 0;

    // Indicadores principais
    const valorPorKm = distancia > 0 ? valor / distancia : 0;
    const valorPorHora = tempoEstimado > 0 ? (valor / tempoEstimado) * 60 : 0;

    // Verificar se atende aos mínimos
    const atendeRsPorKm = valorPorKm >= rsPorKmMinimo;
    const atendeRsPorHora = valorPorHora >= rsPorHoraMinimo;

    // Score baseado em múltiplos fatores
    let score = 0;
    let motivos = [];

    // Fator 1: Margem de lucro (0-40 pontos)
    if (margemLucro > 50) {
      score += 40;
      motivos.push('Margem de lucro excelente');
    } else if (margemLucro > 30) {
      score += 30;
      motivos.push('Boa margem de lucro');
    } else if (margemLucro > 15) {
      score += 20;
      motivos.push('Margem de lucro razoável');
    } else if (margemLucro > 0) {
      score += 10;
      motivos.push('Margem de lucro baixa');
    } else {
      score -= 20;
      motivos.push('Prejuízo garantido');
    }

    // Fator 2: R$/km mínimo (0-20 pontos)
    if (atendeRsPorKm) {
      score += 20;
      motivos.push(`R$ ${valorPorKm.toFixed(2)}/km (mínimo: R$ ${rsPorKmMinimo.toFixed(2)})`);
    } else {
      score -= 15;
      motivos.push(`R$ ${valorPorKm.toFixed(2)}/km abaixo do mínimo (R$ ${rsPorKmMinimo.toFixed(2)})`);
    }

    // Fator 3: R$/hora mínimo (0-20 pontos)
    if (atendeRsPorHora) {
      score += 20;
      motivos.push(`R$ ${valorPorHora.toFixed(2)}/h (mínimo: R$ ${rsPorHoraMinimo.toFixed(2)})`);
    } else {
      score -= 15;
      motivos.push(`R$ ${valorPorHora.toFixed(2)}/h abaixo do mínimo (R$ ${rsPorHoraMinimo.toFixed(2)})`);
    }

    // Fator 4: Limites de distância e tempo (0-10 pontos)
    if (excedeDistanciaMaxima) {
      score -= 10;
      motivos.push(`Distância (${distancia.toFixed(1)} km) excede máximo (${distanciaMaxima} km)`);
    } else {
      score += 5;
    }

    if (excedeTempoMaximo) {
      score -= 10;
      motivos.push(`Tempo (${tempoEstimado} min) excede máximo (${tempoMaximoEstimado} min)`);
    } else {
      score += 5;
    }

    if (excedeDistanciaCliente) {
      score -= 5;
      motivos.push(`Distância até cliente (${distanciaAteCliente.toFixed(1)} km) excede máximo (${distanciaMaximaCliente} km)`);
    }

    // Fator 5: Perfil de trabalho (0-10 pontos)
    if (perfilTrabalho === 'giro-rapido' && distancia <= 5) {
      score += 10;
      motivos.push('Ideal para giro rápido');
    } else if (perfilTrabalho === 'corridas-longas' && distancia > 8) {
      score += 10;
      motivos.push('Ideal para corridas longas');
    } else if (perfilTrabalho === 'misto') {
      score += 5;
    } else {
      score -= 5;
      motivos.push('Não alinhado com perfil de trabalho');
    }

    // Fator 6: Preferências de apps (0-10 pontos)
    const appPref = preferenciasApps[plataforma] || {};
    if (appPref.preferido) {
      score += 10;
      motivos.push(`App preferido: ${plataforma}`);
    } else if (appPref.evitar) {
      score -= 10;
      motivos.push(`App a evitar: ${plataforma}`);
    }

    // Normalizar score (0-100)
    score = Math.max(0, Math.min(100, score));

    // Determinar viabilidade baseado no score
    let viabilidade = 'ruim';
    let recomendacao = 'Não compensa';

    if (score >= 80) {
      viabilidade = 'excelente';
      recomendacao = 'Corrida muito lucrativa! Aceite!';
    } else if (score >= 60) {
      viabilidade = 'boa';
      recomendacao = 'Corrida compensa! Boa margem.';
    } else if (score >= 40) {
      viabilidade = 'razoavel';
      recomendacao = 'Pode aceitar, mas não é ideal.';
    } else if (score >= 20) {
      viabilidade = 'ruim';
      recomendacao = 'Lucro baixo, considere rejeitar.';
    } else {
      viabilidade = 'pessima';
      recomendacao = 'Não compensa! Prejuízo garantido.';
    }

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
      score: parseFloat(score.toFixed(1)),
      motivos,
      atendeRsPorKm,
      atendeRsPorHora,
      excedeDistanciaMaxima,
      excedeTempoMaximo,
      excedeDistanciaCliente,
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

