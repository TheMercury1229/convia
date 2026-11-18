import { eq } from "drizzle-orm";
import db from "../../db/db";
import { orgCredits } from "../../db/schema/billing-schema";
import { grantPlanCredits, setOrgPlan } from "./billing.service";
import type { Plan } from "../../db/schema/billing-schema";
import ENV_CONFIG from "../../config/env.config";

// ---------------------------------------------------------------------------
// Map Dodo product IDs to plan names
// ---------------------------------------------------------------------------

const resolveProductPlan = (productId?: string): Plan | null => {
  if (!productId) return null;
  const builderId = ENV_CONFIG.DODO_PRODUCT_BUILDER || process.env.DODO_PRODUCT_BUILDER;
  const proId = ENV_CONFIG.DODO_PRODUCT_PRO || process.env.DODO_PRODUCT_PRO;
  if (builderId && productId === builderId) return "builder";
  if (proId && productId === proId) return "pro";
  return null;
};

// ---------------------------------------------------------------------------
// Resolve org from Dodo subscription — we store orgId as metadata at checkout
// and also fall back to looking it up by dodoSubscriptionId
// ---------------------------------------------------------------------------

const resolveOrgId = async (
  payload: Record<string, any>,
): Promise<string | null> => {
  // Primary: metadata.org_id set at checkout
  const metaOrgId =
    payload?.data?.metadata?.org_id ??
    payload?.data?.subscription?.metadata?.org_id ??
    payload?.data?.customer?.metadata?.org_id ??
    null;
  if (metaOrgId) return metaOrgId;

  // Fallback: look up by subscription ID
  const subscriptionId =
    payload?.data?.subscription_id ?? payload?.data?.subscription?.subscription_id;
  if (!subscriptionId) return null;

  const row = await db.query.orgCredits.findFirst({
    where: eq(orgCredits.dodoSubscriptionId, subscriptionId),
  });
  return row?.orgId ?? null;
};

// ---------------------------------------------------------------------------
// Main webhook handler — called from auth.ts onPayload
// ---------------------------------------------------------------------------

export const handleDodoWebhook = async (payload: any): Promise<void> => {
  // Dodo Payments webhook payload uses `type` (e.g. "subscription.active", "payment.succeeded")
  const eventType: string = payload?.type ?? payload?.event_type ?? "";

  console.log(`[billing-webhook] event: ${eventType}`);

  try {
    switch (eventType) {
      // -----------------------------------------------------------------------
      // Subscription active / created — grant credits for the purchased plan
      // Dodo Payments emits "subscription.active" when checkout finishes
      // -----------------------------------------------------------------------
      case "subscription.active":
      case "subscription.created": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) {
          console.warn(`[billing-webhook] ${eventType}: no orgId found`);
          return;
        }
        const productId = payload?.data?.product_id ?? payload?.data?.product_cart?.[0]?.product_id;
        const plan = resolveProductPlan(productId);
        if (!plan) {
          console.warn(`[billing-webhook] ${eventType}: unknown product ${productId}`);
          return;
        }
        const customerId =
          payload?.data?.customer?.customer_id ?? payload?.data?.customer_id;
        const subscriptionId = payload?.data?.subscription_id;
        await grantPlanCredits(
          orgId,
          plan,
          customerId,
          subscriptionId,
        );
        console.log(`[billing-webhook] granted ${plan} credits to org ${orgId}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Subscription renewed — reset credits to plan total for the new cycle
      // -----------------------------------------------------------------------
      case "subscription.renewed": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) return;
        const productId = payload?.data?.product_id ?? payload?.data?.product_cart?.[0]?.product_id;
        const plan = resolveProductPlan(productId);
        if (!plan) return;
        const customerId =
          payload?.data?.customer?.customer_id ?? payload?.data?.customer_id;
        const subscriptionId = payload?.data?.subscription_id;
        await grantPlanCredits(orgId, plan, customerId, subscriptionId);
        console.log(`[billing-webhook] renewed ${plan} credits for org ${orgId}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Subscription cancelled or expired — downgrade to free on next cycle
      // We set the plan flag immediately; credits remain until cycleEnd
      // -----------------------------------------------------------------------
      case "subscription.cancelled":
      case "subscription.expired": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) return;
        await setOrgPlan(orgId, "free");
        console.log(`[billing-webhook] downgraded org ${orgId} to free`);
        break;
      }

      // -----------------------------------------------------------------------
      // Plan updated (upgrade or downgrade mid-cycle)
      // -----------------------------------------------------------------------
      case "subscription.plan_changed":
      case "subscription.updated": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) return;
        const productId = payload?.data?.product_id ?? payload?.data?.product_cart?.[0]?.product_id;
        const plan = resolveProductPlan(productId);
        if (!plan) return;
        const customerId =
          payload?.data?.customer?.customer_id ?? payload?.data?.customer_id;
        const subscriptionId = payload?.data?.subscription_id;
        // On upgrade: grant the new plan's full credits immediately
        await grantPlanCredits(orgId, plan, customerId, subscriptionId);
        console.log(`[billing-webhook] plan updated to ${plan} for org ${orgId}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Payment succeeded notification
      // -----------------------------------------------------------------------
      case "payment.succeeded": {
        console.log(`[billing-webhook] payment succeeded for payment_id: ${payload?.data?.payment_id}`);
        break;
      }

      default:
        // Unhandled events are silently ignored — avoids noise from checkout events etc.
        break;
    }
  } catch (err) {
    console.error(`[billing-webhook] error processing ${eventType}:`, err);
    // Do not rethrow — Dodo expects 200 for webhook delivery confirmation
  }
};
