import { eq } from "drizzle-orm";
import db from "../../db/db";
import { orgCredits } from "../../db/schema/billing-schema";
import { grantPlanCredits, setOrgPlan } from "./billing.service";
import type { Plan } from "../../db/schema/billing-schema";

// ---------------------------------------------------------------------------
// Map Dodo product IDs to plan names
// ---------------------------------------------------------------------------

const PRODUCT_PLAN_MAP: Record<string, Plan> = {
  [process.env.DODO_PRODUCT_BUILDER ?? ""]: "builder",
  [process.env.DODO_PRODUCT_PRO ?? ""]: "pro",
};

const resolveProductPlan = (productId?: string): Plan | null => {
  if (!productId) return null;
  return PRODUCT_PLAN_MAP[productId] ?? null;
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
  const eventType: string = payload?.event_type ?? "";

  console.log(`[billing-webhook] event: ${eventType}`);

  try {
    switch (eventType) {
      // -----------------------------------------------------------------------
      // New subscription created — grant credits for the purchased plan
      // -----------------------------------------------------------------------
      case "subscription.created": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) {
          console.warn("[billing-webhook] subscription.created: no orgId found");
          return;
        }
        const plan = resolveProductPlan(payload?.data?.product_id);
        if (!plan) {
          console.warn("[billing-webhook] subscription.created: unknown product");
          return;
        }
        await grantPlanCredits(
          orgId,
          plan,
          payload?.data?.customer_id,
          payload?.data?.subscription_id,
        );
        console.log(`[billing-webhook] granted ${plan} credits to org ${orgId}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Subscription renewed — reset credits to plan total for the new cycle
      // -----------------------------------------------------------------------
      case "subscription.renewed":
      case "subscription.active": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) return;
        const plan = resolveProductPlan(payload?.data?.product_id);
        if (!plan) return;
        await grantPlanCredits(orgId, plan);
        console.log(`[billing-webhook] renewed ${plan} credits for org ${orgId}`);
        break;
      }

      // -----------------------------------------------------------------------
      // Subscription cancelled — downgrade to free on next cycle
      // We set the plan flag immediately; credits remain until cycleEnd
      // -----------------------------------------------------------------------
      case "subscription.cancelled": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) return;
        await setOrgPlan(orgId, "free");
        console.log(`[billing-webhook] downgraded org ${orgId} to free`);
        break;
      }

      // -----------------------------------------------------------------------
      // Plan updated (upgrade or downgrade mid-cycle)
      // -----------------------------------------------------------------------
      case "subscription.updated": {
        const orgId = await resolveOrgId(payload);
        if (!orgId) return;
        const plan = resolveProductPlan(payload?.data?.product_id);
        if (!plan) return;
        // On upgrade: grant the new plan's full credits immediately
        await grantPlanCredits(orgId, plan);
        console.log(`[billing-webhook] plan updated to ${plan} for org ${orgId}`);
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
