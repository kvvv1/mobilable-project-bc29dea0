import { Router, Response } from 'express';
import { supabase } from '../index';
import { authenticate, requireOrganization, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/organizations
 * Lista organizações do usuário
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organizations(*)
      `)
      .eq('user_id', req.user.id);

    if (error) {
      throw createError('Erro ao buscar organizações', 500);
    }

    res.json({
      organizations: members?.map((m: any) => ({
        ...m.organization,
        role: m.role,
      })) || [],
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao listar organizações',
    });
  }
});

/**
 * GET /api/organizations/:id
 * Busca detalhes de uma organização
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const { id } = req.params;

    // Verificar se o usuário pertence à organização
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member) {
      throw createError('Organização não encontrada ou acesso negado', 404);
    }

    // Buscar organização
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw createError('Erro ao buscar organização', 500);
    }

    // Buscar configurações
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', id)
      .single();

    res.json({
      organization: {
        ...organization,
        role: member.role,
        settings,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao buscar organização',
    });
  }
});

/**
 * POST /api/organizations
 * Cria uma nova organização
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const { name } = req.body;

    if (!name) {
      throw createError('Nome da organização é obrigatório', 400);
    }

    // Criar organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        owner_id: req.user.id,
        subscription_status: 'trial',
        subscription_plan: 'free',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Erro ao criar organização:', orgError);
      // Se for erro de recursão, fornecer mensagem mais clara
      if (orgError.code === '42P17') {
        throw createError(
          'Erro de configuração: políticas RLS precisam ser atualizadas. Execute a migration 003_fix_rls_recursion.sql no Supabase.',
          500
        );
      }
      throw createError('Erro ao criar organização', 500);
    }

    if (!organization) {
      throw createError('Organização criada mas não retornada', 500);
    }

    // Adicionar usuário como owner
    // Usar um pequeno delay para garantir que a organização está visível
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: req.user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Erro ao adicionar membro:', memberError);
      // Se falhar ao adicionar membro, tentar deletar a organização criada
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      
      if (memberError.code === '42P17') {
        throw createError(
          'Erro de configuração: políticas RLS precisam ser atualizadas. Execute a migration 003_fix_rls_recursion.sql no Supabase.',
          500
        );
      }
      throw createError('Erro ao adicionar membro à organização', 500);
    }

    // Criar configurações padrão
    const { error: settingsError } = await supabase
      .from('organization_settings')
      .insert({
        organization_id: organization.id,
      });

    if (settingsError) {
      console.error('Erro ao criar configurações padrão:', settingsError);
    }

    res.status(201).json({
      message: 'Organização criada com sucesso',
      organization,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao criar organização',
    });
  }
});

/**
 * PUT /api/organizations/:id
 * Atualiza uma organização (apenas owner/admin)
 */
router.put('/:id', requireOrganization, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const { id } = req.params;
    const { name } = req.body;

    // Verificar permissões
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw createError('Acesso negado', 403);
    }

    const updates: any = {};
    if (name) updates.name = name;

    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError('Erro ao atualizar organização', 500);
    }

    res.json({
      message: 'Organização atualizada com sucesso',
      organization,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao atualizar organização',
    });
  }
});

export default router;


