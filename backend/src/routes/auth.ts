import { Router, Response } from 'express';
import { supabase } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/auth/me
 * Retorna informações do usuário autenticado
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        current_organization:organizations(*)
      `)
      .eq('id', req.user.id)
      .single();

    if (error) {
      // Se o perfil não existe (PGRST116), retornar null em vez de erro
      // O perfil será criado pelo trigger quando necessário
      if (error.code === 'PGRST116') {
        console.warn('Perfil não encontrado para usuário:', req.user.id);
        // Retornar resposta sem perfil, mas não falhar a requisição
      } else {
        throw createError('Erro ao buscar perfil', 500);
      }
    }

    // Buscar organizações do usuário
    const { data: organizations } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organizations(*)
      `)
      .eq('user_id', req.user.id);

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        profile: profile || null,
        organizations: organizations?.map((m: any) => ({
          ...m.organization,
          role: m.role,
        })) || [],
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao buscar informações do usuário',
    });
  }
});

/**
 * POST /api/auth/ensure-profile
 * Garante que o usuário tem perfil e organização criados
 * Cria se não existir (substitui o trigger que pode falhar)
 */
router.post('/ensure-profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Verificar se perfil já existe
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id, current_organization_id')
      .eq('id', req.user.id)
      .single();

    // Se perfil existe e tem organização, retornar sucesso
    if (!profileCheckError && existingProfile?.current_organization_id) {
      return res.json({
        success: true,
        message: 'Perfil e organização já existem',
        organizationId: existingProfile.current_organization_id,
      });
    }

    // Criar organização
    const orgName = req.user.user_metadata?.full_name || 
                   req.user.email?.split('@')[0] || 
                   'Minha Organização';
    const orgSlug = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: orgSlug,
        owner_id: req.user.id,
        subscription_status: 'trial',
        subscription_plan: 'free',
      })
      .select()
      .single();

    if (orgError) {
      console.error('Erro ao criar organização:', orgError);
      throw createError('Erro ao criar organização', 500);
    }

    if (!organization) {
      throw createError('Organização criada mas não retornada', 500);
    }

    // Aguardar um pouco para garantir visibilidade
    await new Promise(resolve => setTimeout(resolve, 100));

    // Adicionar usuário como membro
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
      // Tentar deletar organização criada
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id);
      throw createError('Erro ao adicionar membro à organização', 500);
    }

    // Criar ou atualizar perfil
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: req.user.id,
        email: req.user.email || '',
        full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'Usuário',
        current_organization_id: organization.id,
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Erro ao criar/atualizar perfil:', profileError);
      throw createError('Erro ao criar perfil', 500);
    }

    // Criar configurações padrão
    const { error: settingsError } = await supabase
      .from('organization_settings')
      .insert({
        organization_id: organization.id,
      })
      .select()
      .single();

    if (settingsError && !settingsError.message.includes('duplicate')) {
      console.error('Erro ao criar configurações padrão:', settingsError);
      // Não falhar se já existir
    }

    res.status(201).json({
      success: true,
      message: 'Perfil e organização criados com sucesso',
      organizationId: organization.id,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Erro ao garantir perfil',
    });
  }
});

/**
 * POST /api/auth/switch-organization
 * Troca a organização ativa do usuário
 */
router.post(
  '/switch-organization',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        throw createError('Usuário não autenticado', 401);
      }

      const { organizationId } = req.body;

      if (!organizationId) {
        throw createError('ID da organização é obrigatório', 400);
      }

      // Verificar se o usuário pertence à organização
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', req.user.id)
        .single();

      if (memberError || !member) {
        throw createError('Usuário não pertence a esta organização', 403);
      }

      // Atualizar organização atual
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ current_organization_id: organizationId })
        .eq('id', req.user.id);

      if (updateError) {
        throw createError('Erro ao trocar organização', 500);
      }

      res.json({
        message: 'Organização trocada com sucesso',
        organizationId,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Erro ao trocar organização',
      });
    }
  }
);

export default router;


