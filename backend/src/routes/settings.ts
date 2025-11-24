import { Router, Response } from 'express';
import { supabase } from '../index';
import { authenticate, requireOrganization, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);
router.use(requireOrganization);

/**
 * GET /api/settings
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { data: settings, error } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .single();

    if (error) {
      throw createError('Erro ao buscar configurações', 500);
    }

    res.json({ settings: settings || {} });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao buscar configurações',
    });
  }
});

/**
 * PUT /api/settings
 */
router.put('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { data: settings, error } = await supabase
      .from('organization_settings')
      .update(req.body)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) {
      throw createError('Erro ao atualizar configurações', 500);
    }

    res.json({
      message: 'Configurações atualizadas com sucesso',
      settings,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao atualizar configurações',
    });
  }
});

export default router;


