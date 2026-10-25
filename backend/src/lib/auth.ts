import { betterAuth } from "better-auth";
import db from "../db/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { ac, owner, editor, viewer } from "./permissions";
import * as schema from "../db/schema/index";
import ENV_CONFIG from "../config/env.config";
import { sendInvitationEmail } from "./email";
import { dodopayments, checkout, portal, webhooks } from "@dodopayments/better-auth";
import DodoPayments from "dodopayments";
import { seedOrgCredits } from "../modules/billing/billing.repository";
import { handleDodoWebhook } from "../modules/billing/billing.webhook-handler";
import { orgCredits } from "../db/schema/billing-schema";
import { eq, count } from "drizzle-orm";
import { member } from "../db/schema/auth-schema";

export const dodoPayments = new DodoPayments({
  bearerToken: ENV_CONFIG.DODO_PAYMENTS_API_KEY!,
  environment: ENV_CONFIG.NODE_ENV === "production" ? "live_mode" : "test_mode",
});

export const auth = betterAuth({
  baseURL: ENV_CONFIG.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: ENV_CONFIG.GOOGLE_CLIENT_ID!,
      clientSecret: ENV_CONFIG.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [ENV_CONFIG.CLIENT_URL!],
  user: {
    deleteUser: {
      enabled: true,
    }
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create the default org for the new user (same as before)
          try {
            const orgId = crypto.randomUUID();
            const baseSlug = (user.name || "org")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "") || "org";
            const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

            await db.insert(schema.organization).values({
              id: orgId,
              name: `${user.name || "User"}'s Organisation`,
              slug,
              createdAt: new Date(),
            });

            await db.insert(schema.member).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              userId: user.id,
              role: "owner",
              createdAt: new Date(),
            });

            // Seed Grizzy Credits for the new org (free plan, 100 credits)
            await seedOrgCredits(orgId);
          } catch (error) {
            console.error("Error creating default organisation on signup:", error);
          }
        },
      },
    },
  },

  plugins: [
    organization({
      ac,
      roles: {
        owner,
        editor,
        viewer,
      },
      creatorRole: "owner",
      sendInvitationEmail: async (data) => {
        await sendInvitationEmail(data);
      },
      // Enforce org creation limit based on the user's primary org plan
      organizationCreation: {
        beforeCreate: async ({ user: orgUser }: { user: any }) => {
          try {
            // Find all orgs where this user is the owner
            const ownerMemberships = await db
              .select({ orgId: member.organizationId })
              .from(member)
              .where(eq(member.userId, orgUser.id));

            if (ownerMemberships.length === 0) return; // first org, always allowed

            // Check the plan of the user's first (primary) org
            const primaryOrgId = ownerMemberships[0].orgId;
            const credits = await db.query.orgCredits.findFirst({
              where: eq(orgCredits.orgId, primaryOrgId),
            });

            const plan = credits?.plan ?? "free";

            const orgCount = ownerMemberships.length;
            if (plan === "free" && orgCount >= 1) {
              throw new Error("Free plan allows only 1 organisation. Upgrade to create more.");
            }
            if (plan === "builder" && orgCount >= 5) {
              throw new Error("Builder plan allows up to 5 organisations. Upgrade to Pro for unlimited.");
            }
            // Pro: unlimited — no check needed
          } catch (err: any) {
            if (err.message?.includes("plan allows")) throw err;
            console.error("Error checking org limit:", err);
          }
        },
        afterCreate: async ({ organization: org }: { organization: any }) => {
          // Seed Grizzy Credits for every newly created org
          try {
            await seedOrgCredits(org.id);
          } catch (err) {
            console.error("Error seeding org credits on org creation:", err);
          }
        },
      },
    }),
    dodopayments({
      client: dodoPayments as any,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            { productId: ENV_CONFIG.DODO_PRODUCT_BUILDER!, slug: "builder" },
            { productId: ENV_CONFIG.DODO_PRODUCT_PRO!, slug: "pro" },
          ],
          successUrl: `${ENV_CONFIG.CLIENT_URL}/billing/success?checkout_id={CHECKOUT_ID}`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          webhookKey: ENV_CONFIG.DODO_PAYMENTS_WEBHOOK_SECRET!,
          onPayload: async (payload: any) => {
            await handleDodoWebhook(payload);
          },
        }),
      ],
    }),
  ],
});
