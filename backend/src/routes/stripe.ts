import { Router, Response } from 'express';
import { supabase, stripe } from '../index';
import { authenticate, requireOrganization, requireAdmin, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);
router.use(requireOrganization);

/**
 * GET /api/stripe/plans
 * Lista planos disponíveis
 */
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      throw createError('Erro ao buscar planos', 500);
    }

    res.json({ plans: plans || [] });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao listar planos',
    });
  }
});

/**
 * POST /api/stripe/create-checkout-session
 * Cria sessão de checkout do Stripe
 */
router.post('/create-checkout-session', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      throw createError('Price ID é obrigatório', 400);
    }

    // Buscar organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', req.user.organizationId)
      .single();

    if (orgError || !organization) {
      throw createError('Organização não encontrada', 404);
    }

    // Criar ou buscar customer no Stripe
    let customerId = organization.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          organization_id: req.user.organizationId,
        },
      });
      customerId = customer.id;

      // Salvar customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.organizationId);
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.API_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.API_BASE_URL}/cancel`,
      metadata: {
        organization_id: req.user.organizationId,
      },
      subscription_data: {
        metadata: {
          organization_id: req.user.organizationId,
        },
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erro ao criar checkout session:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao criar sessão de checkout',
    });
  }
});

/**
 * POST /api/stripe/create-portal-session
 * Cria sessão do Customer Portal do Stripe
 */
router.post('/create-portal-session', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    const { returnUrl } = req.body;

    // Buscar organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', req.user.organizationId)
      .single();

    if (orgError || !organization?.stripe_customer_id) {
      throw createError('Customer do Stripe não encontrado', 404);
    }

    // Criar sessão do portal
    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: returnUrl || `${process.env.API_BASE_URL}/settings`,
    });

    res.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erro ao criar portal session:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao criar sessão do portal',
    });
  }
});

/**
 * GET /api/stripe/subscription
 * Retorna informações da assinatura atual
 */
router.get('/subscription', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      throw createError('Organização não encontrada', 400);
    }

    // Buscar organização
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', req.user.organizationId)
      .single();

    if (orgError || !organization) {
      throw createError('Organização não encontrada', 404);
    }

    let subscription = null;
    if (organization.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(
          organization.stripe_subscription_id
        );
      } catch (error) {
        console.error('Erro ao buscar subscription:', error);
      }
    }

    res.json({
      organization: {
        subscription_status: organization.subscription_status,
        subscription_plan: organization.subscription_plan,
        trial_ends_at: organization.trial_ends_at,
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        items: subscription.items.data.map((item: any) => ({
          id: item.id,
          price_id: item.price.id,
          product_id: item.price.product,
        })),
      } : null,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      error: error.message || 'Erro ao buscar assinatura',
    });
  }
});

export default router;


