import Stripe from 'stripe';
import { config } from '../config';

// Initialize Stripe
const stripe = new Stripe(config.stripeSecretKey, {
//   apiVersion: '2023-10-16',
});

export const createCustomer = async (
  email: string,
  name?: string
): Promise<string> => {
  const customer = await stripe.customers.create({
    email,
    name,
  });
  
  return customer.id;
};

export const createSubscription = async (
  customerId: string,
  priceId: string
): Promise<string> => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  return subscription.id;
};

export const createCheckoutSession = async (
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  
  return session.url || '';
};

export const handleWebhookEvent = async (
  signature: string,
  payload: Buffer,
  endpointSecret: string
): Promise<Stripe.Event> => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret
  );
};

export const cancelSubscription = async (
  subscriptionId: string
): Promise<void> => {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};