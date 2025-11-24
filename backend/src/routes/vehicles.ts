import { Router, Response } from 'express';
import { supabase } from '../index';
import { authenticate, requireOrganization, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(requireOrganization);

const vehicleSchema = z.object({
  tipo: z.enum(['moto', 'carro']),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  ano: z.string().optional(),
  consumo_medio: z.number().positive(),
  personalizado: z.boolean().optional(),
});

/**
 * GET /api/vehicles
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError('Erro ao buscar veículos', 500);
    }

    res.json({ vehicles: vehicles || [] });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao listar veículos',
    });
  }
});

/**
 * POST /api/vehicles
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const validatedData = vehicleSchema.parse(req.body);

    const vehicleData = {
      organization_id: req.user.organizationId,
      user_id: req.user.id,
      ...validatedData,
    };

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) {
      throw createError('Erro ao criar veículo', 500);
    }

    res.status(201).json({
      message: 'Veículo criado com sucesso',
      vehicle,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao criar veículo',
    });
  }
});

/**
 * PUT /api/vehicles/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;
    const validatedData = vehicleSchema.partial().parse(req.body);

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(validatedData)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) {
      throw createError('Erro ao atualizar veículo', 500);
    }

    res.json({
      message: 'Veículo atualizado com sucesso',
      vehicle,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao atualizar veículo',
    });
  }
});

/**
 * DELETE /api/vehicles/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('vehicles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) {
      throw createError('Erro ao deletar veículo', 500);
    }

    res.json({
      message: 'Veículo deletado com sucesso',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao deletar veículo',
    });
  }
});

export default router;


