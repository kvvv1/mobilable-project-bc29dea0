import { Router, Request, Response } from 'express';
import express from 'express';
import { supabase, stripe } from '../index';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Webhook do Stripe não usa autenticação JWT, usa assinatura do Stripe
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Salvar evento no banco
  await supabase
    .from('stripe_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object,
      processed: false,
    });

  // Processar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Marcar evento como processado
    await supabase
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    // Não retornar erro para o Stripe, mas logar
  }

  res.json({ received: true });
});

async function handleCheckoutCompleted(session: any) {
  const organizationId = session.metadata?.organization_id;
  const subscriptionId = session.subscription;

  if (!organizationId || !subscriptionId) {
    console.error('Missing organization_id or subscription_id in checkout session');
    return;
  }

  // Buscar subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Buscar plano
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  // Atualizar organização
  await supabase
    .from('organizations')
    .update({
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status === 'active' ? 'active' : 'incomplete',
      subscription_plan: plan?.name || 'basic',
    })
    .eq('id', organizationId);

  // Salvar histórico
  await supabase
    .from('subscription_history')
    .insert({
      organization_id: organizationId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: subscription.customer as string,
      plan_id: plan?.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleSubscriptionUpdated(subscription: any) {
  const organizationId = subscription.metadata?.organization_id;

  if (!organizationId) {
    // Tentar buscar por customer_id
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (!org) {
      console.error('Organization not found for subscription:', subscription.id);
      return;
    }
    organizationId = org.id;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  // Atualizar organização
  await supabase
    .from('organizations')
    .update({
      subscription_status: mapStripeStatus(subscription.status),
      subscription_plan: plan?.name || 'basic',
    })
    .eq('id', organizationId);

  // Atualizar histórico
  await supabase
    .from('subscription_history')
    .insert({
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      plan_id: plan?.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleSubscriptionDeleted(subscription: any) {
  const organizationId = subscription.metadata?.organization_id;

  if (!organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (!org) return;
    organizationId = org.id;
  }

  // Atualizar organização
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('id', organizationId);

  // Atualizar histórico
  await supabase
    .from('subscription_history')
    .insert({
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    });
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  const organizationId = subscription.metadata?.organization_id;

  if (!organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!org) return;
    organizationId = org.id;
  }

  // Atualizar status para active
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
    })
    .eq('id', organizationId);
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  const organizationId = subscription.metadata?.organization_id;

  if (!organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!org) return;
    organizationId = org.id;
  }

  // Atualizar status para past_due
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', organizationId);
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trial',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'trial',
    incomplete_expired: 'canceled',
  };

  return statusMap[status] || 'trial';
}

export default router;

