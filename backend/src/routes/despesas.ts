import { Router, Response } from 'express';
import { supabase } from '../index';
import { authenticate, requireOrganization, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(requireOrganization);

const despesaSchema = z.object({
  tipo: z.enum([
    'combustivel',
    'manutencao',
    'alimentacao',
    'estacionamento',
    'lavagem',
    'seguro',
    'licenciamento',
    'multa',
    'outros',
  ]),
  valor: z.number().positive(),
  descricao: z.string().optional(),
  vehicle_id: z.string().uuid().optional(),
  data_despesa: z.string().datetime().optional(),
});

/**
 * GET /api/despesas
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { page = '1', limit = '50', tipo, start_date, end_date } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('despesas')
      .select('*, vehicle:vehicles(*)', { count: 'exact' })
      .eq('organization_id', req.user.organizationId)
      .is('deleted_at', null)
      .order('data_despesa', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (tipo) query = query.eq('tipo', tipo as string);
    if (start_date) query = query.gte('data_despesa', start_date as string);
    if (end_date) query = query.lte('data_despesa', end_date as string);

    const { data: despesas, error, count } = await query;

    if (error) {
      throw createError('Erro ao buscar despesas', 500);
    }

    res.json({
      despesas: despesas || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao listar despesas',
    });
  }
});

/**
 * GET /api/despesas/stats
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { start_date, end_date } = req.query;

    let query = supabase
      .from('despesas')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .is('deleted_at', null);

    if (start_date) query = query.gte('data_despesa', start_date as string);
    if (end_date) query = query.lte('data_despesa', end_date as string);

    const { data: despesas, error } = await query;

    if (error) {
      throw createError('Erro ao buscar estatísticas', 500);
    }

    const stats = {
      total_despesas: despesas?.length || 0,
      total_valor: despesas?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0,
      por_tipo: despesas?.reduce((acc: any, d) => {
        acc[d.tipo] = (acc[d.tipo] || 0) + (d.valor || 0);
        return acc;
      }, {}) || {},
    };

    res.json({ stats });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao calcular estatísticas',
    });
  }
});

/**
 * POST /api/despesas
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const validatedData = despesaSchema.parse(req.body);

    const despesaData = {
      organization_id: req.user.organizationId,
      user_id: req.user.id,
      vehicle_id: validatedData.vehicle_id || null,
      tipo: validatedData.tipo,
      valor: validatedData.valor,
      descricao: validatedData.descricao || null,
      data_despesa: validatedData.data_despesa || new Date().toISOString(),
    };

    const { data: despesa, error } = await supabase
      .from('despesas')
      .insert(despesaData)
      .select('*, vehicle:vehicles(*)')
      .single();

    if (error) {
      throw createError('Erro ao criar despesa', 500);
    }

    res.status(201).json({
      message: 'Despesa criada com sucesso',
      despesa,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao criar despesa',
    });
  }
});

/**
 * PUT /api/despesas/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;
    const validatedData = despesaSchema.partial().parse(req.body);

    const { data: despesa, error } = await supabase
      .from('despesas')
      .update(validatedData)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select('*, vehicle:vehicles(*)')
      .single();

    if (error) {
      throw createError('Erro ao atualizar despesa', 500);
    }

    res.json({
      message: 'Despesa atualizada com sucesso',
      despesa,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao atualizar despesa',
    });
  }
});

/**
 * DELETE /api/despesas/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('despesas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) {
      throw createError('Erro ao deletar despesa', 500);
    }

    res.json({
      message: 'Despesa deletada com sucesso',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao deletar despesa',
    });
  }
});

export default router;


