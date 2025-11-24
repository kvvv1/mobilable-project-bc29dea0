import { Request, Response, NextFunction } from 'express';
import { supabase } from '../index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
  };
}

/**
 * Middleware de autenticação usando Supabase
 * Verifica o token JWT e adiciona informações do usuário ao request
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token de autenticação não fornecido'
      });
    }

    const token = authHeader.substring(7);

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token inválido ou expirado'
      });
    }

    // Buscar organização atual do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('current_organization_id')
      .eq('id', user.id)
      .single();

    // Adicionar informações do usuário ao request
    req.user = {
      id: user.id,
      email: user.email || '',
      organizationId: profile?.current_organization_id || undefined,
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Erro ao processar autenticação'
    });
  }
}

/**
 * Middleware opcional - verifica se o usuário pertence à organização
 */
export async function requireOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.organizationId) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Usuário não possui organização ativa'
    });
  }

  next();
}

/**
 * Middleware para verificar se o usuário é owner ou admin da organização
 */
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.organizationId) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Usuário não possui organização ativa'
    });
  }

  try {
    const { data: member, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', req.user.organizationId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !member) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Usuário não é membro da organização'
      });
    }

    if (!['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Acesso negado. Apenas owners e admins podem realizar esta ação'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Erro ao verificar permissões'
    });
  }
}


