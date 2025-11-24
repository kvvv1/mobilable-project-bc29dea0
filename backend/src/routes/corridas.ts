import { Router, Response } from 'express';
import { supabase } from '../index';
import { authenticate, requireOrganization, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Todas as rotas requerem autenticação e organização
router.use(authenticate);
router.use(requireOrganization);

// Schema de validação
const corridaSchema = z.object({
  plataforma: z.string().min(1),
  valor: z.number().positive(),
  distancia: z.number().positive(),
  tempo_estimado: z.number().int().positive(),
  origem: z.string().optional(),
  destino: z.string().optional(),
  imagem_url: z.string().url().optional(),
  vehicle_id: z.string().uuid().optional(),
  data_corrida: z.string().datetime().optional(),
});

/**
 * GET /api/corridas
 * Lista corridas do usuário/organização
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { 
      page = '1', 
      limit = '50',
      start_date,
      end_date,
      plataforma,
      user_id,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('corridas')
      .select('*, vehicle:vehicles(*)', { count: 'exact' })
      .eq('organization_id', req.user.organizationId)
      .is('deleted_at', null)
      .order('data_corrida', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Filtros opcionais
    if (start_date) {
      query = query.gte('data_corrida', start_date as string);
    }
    if (end_date) {
      query = query.lte('data_corrida', end_date as string);
    }
    if (plataforma) {
      query = query.eq('plataforma', plataforma as string);
    }
    if (user_id) {
      query = query.eq('user_id', user_id as string);
    } else {
      // Se não especificar user_id, mostrar apenas do usuário atual
      query = query.eq('user_id', req.user.id);
    }

    const { data: corridas, error, count } = await query;

    if (error) {
      throw createError('Erro ao buscar corridas', 500);
    }

    res.json({
      corridas: corridas || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao listar corridas',
    });
  }
});

/**
 * GET /api/corridas/stats
 * Retorna estatísticas de corridas
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { start_date, end_date } = req.query;

    let query = supabase
      .from('corridas')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .is('deleted_at', null);

    if (start_date) {
      query = query.gte('data_corrida', start_date as string);
    }
    if (end_date) {
      query = query.lte('data_corrida', end_date as string);
    }

    const { data: corridas, error } = await query;

    if (error) {
      throw createError('Erro ao buscar estatísticas', 500);
    }

    const stats = {
      total_corridas: corridas?.length || 0,
      total_receitas: corridas?.reduce((sum, c) => sum + (c.valor || 0), 0) || 0,
      total_lucro: corridas?.reduce((sum, c) => sum + (c.lucro_liquido || 0), 0) || 0,
      total_km: corridas?.reduce((sum, c) => sum + (c.distancia || 0), 0) || 0,
      valor_medio: corridas?.length ? 
        corridas.reduce((sum, c) => sum + (c.valor || 0), 0) / corridas.length : 0,
      margem_media: corridas?.length ?
        corridas.reduce((sum, c) => sum + (c.margem_lucro || 0), 0) / corridas.length : 0,
    };

    res.json({ stats });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao calcular estatísticas',
    });
  }
});

/**
 * GET /api/corridas/:id
 * Busca uma corrida específica
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;

    const { data: corrida, error } = await supabase
      .from('corridas')
      .select('*, vehicle:vehicles(*)')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();

    if (error || !corrida) {
      throw createError('Corrida não encontrada', 404);
    }

    res.json({ corrida });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao buscar corrida',
    });
  }
});

/**
 * POST /api/corridas
 * Cria uma nova corrida
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    // Validar dados
    const validatedData = corridaSchema.parse(req.body);

    // Buscar configurações para calcular análise
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .single();

    // Calcular análise de viabilidade (simplificado - pode ser melhorado)
    const config = settings || {};
    const distancia = validatedData.distancia;
    const tempoEstimado = validatedData.tempo_estimado;
    const valor = validatedData.valor;

    const mediaKmPorLitro = config.media_km_por_litro || 12;
    const precoCombustivel = config.preco_combustivel || 6.00;
    const custoKm = config.custo_km || 0.5;
    const custoHora = config.custo_hora || 20;

    const custoCombustivel = (distancia / mediaKmPorLitro) * precoCombustivel;
    const custoDesgaste = distancia * custoKm;
    const custoTempo = (tempoEstimado / 60) * custoHora;
    const custoTotal = custoCombustivel + custoDesgaste + custoTempo;
    const lucroLiquido = valor - custoTotal;
    const margemLucro = valor > 0 ? (lucroLiquido / valor) * 100 : 0;
    const valorPorKm = distancia > 0 ? valor / distancia : 0;
    const valorPorHora = tempoEstimado > 0 ? (valor / tempoEstimado) * 60 : 0;

    // Determinar viabilidade
    let viabilidade = 'ruim';
    let score = 0;
    if (margemLucro > 50) {
      viabilidade = 'excelente';
      score = 90;
    } else if (margemLucro > 30) {
      viabilidade = 'boa';
      score = 70;
    } else if (margemLucro > 15) {
      viabilidade = 'razoavel';
      score = 50;
    } else if (margemLucro > 0) {
      viabilidade = 'ruim';
      score = 30;
    } else {
      viabilidade = 'pessima';
      score = 10;
    }

    const corridaData = {
      organization_id: req.user.organizationId,
      user_id: req.user.id,
      vehicle_id: validatedData.vehicle_id || null,
      plataforma: validatedData.plataforma,
      valor: validatedData.valor,
      distancia: validatedData.distancia,
      tempo_estimado: validatedData.tempo_estimado,
      origem: validatedData.origem || null,
      destino: validatedData.destino || null,
      imagem_url: validatedData.imagem_url || null,
      data_corrida: validatedData.data_corrida || new Date().toISOString(),
      custo_combustivel: parseFloat(custoCombustivel.toFixed(2)),
      custo_desgaste: parseFloat(custoDesgaste.toFixed(2)),
      custo_tempo: parseFloat(custoTempo.toFixed(2)),
      custo_total: parseFloat(custoTotal.toFixed(2)),
      lucro_liquido: parseFloat(lucroLiquido.toFixed(2)),
      margem_lucro: parseFloat(margemLucro.toFixed(2)),
      valor_por_km: parseFloat(valorPorKm.toFixed(2)),
      valor_por_hora: parseFloat(valorPorHora.toFixed(2)),
      score: parseFloat(score.toFixed(1)),
      viabilidade,
      recomendacao: viabilidade === 'excelente' ? 'Corrida muito lucrativa! Aceite!' : 
                   viabilidade === 'boa' ? 'Corrida compensa! Boa margem.' :
                   viabilidade === 'razoavel' ? 'Pode aceitar, mas não é ideal.' :
                   viabilidade === 'ruim' ? 'Lucro baixo, considere rejeitar.' :
                   'Não compensa! Prejuízo garantido.',
    };

    const { data: corrida, error } = await supabase
      .from('corridas')
      .insert(corridaData)
      .select('*, vehicle:vehicles(*)')
      .single();

    if (error) {
      throw createError('Erro ao criar corrida', 500);
    }

    res.status(201).json({
      message: 'Corrida criada com sucesso',
      corrida,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao criar corrida',
    });
  }
});

/**
 * PUT /api/corridas/:id
 * Atualiza uma corrida
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;
    const validatedData = corridaSchema.partial().parse(req.body);

    // Verificar se a corrida existe e pertence à organização
    const { data: existing } = await supabase
      .from('corridas')
      .select('id')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();

    if (!existing) {
      throw createError('Corrida não encontrada', 404);
    }

    const { data: corrida, error } = await supabase
      .from('corridas')
      .update(validatedData)
      .eq('id', id)
      .select('*, vehicle:vehicles(*)')
      .single();

    if (error) {
      throw createError('Erro ao atualizar corrida', 500);
    }

    res.json({
      message: 'Corrida atualizada com sucesso',
      corrida,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao atualizar corrida',
    });
  }
});

/**
 * DELETE /api/corridas/:id
 * Remove uma corrida (soft delete)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('corridas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) {
      throw createError('Erro ao deletar corrida', 500);
    }

    res.json({
      message: 'Corrida deletada com sucesso',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao deletar corrida',
    });
  }
});

export default router;


