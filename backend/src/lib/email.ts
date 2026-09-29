import { BrevoClient } from "@getbrevo/brevo";
import ENV_CONFIG from "../config/env.config";
import { buildInvitationHtml, buildInvitationText } from "./email-templates";

export interface InvitationEmailPayload {
  id: string;
  role: string;
  email: string;
  organization: {
    id: string;
    name: string;
    slug?: string;
    logo?: string | null;
  };
  inviter: {
    user?: {
      name?: string | null;
      email?: string | null;
    };
  };
  invitation?: {
    expiresAt?: Date | string;
  };
}

let brevoClient: BrevoClient | null = null;

if (ENV_CONFIG.BREVO_API_KEY) {
  brevoClient = new BrevoClient({
    apiKey: ENV_CONFIG.BREVO_API_KEY,
  });
}

/**
 * Sends workspace invitation email via Brevo and logs the invitation link to the console in one line.
 */
export async function sendInvitationEmail(data: InvitationEmailPayload): Promise<void> {
  const clientUrl = (ENV_CONFIG.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
  const inviteLink = `${clientUrl}/accept-invitation?id=${data.id}`;

  const organizationName = data.organization?.name || "your team";
  const role = data.role || "member";
  const inviterName = data.inviter?.user?.name || "A team member";
  const inviterEmail = data.inviter?.user?.email || "team@convia.app";
  const recipientEmail = data.email;

  // Single-line log for easy terminal following & clicking
  console.log(`[Invite Link] ${inviteLink}`);

  // Prepare HTML and Text templates
  const htmlContent = buildInvitationHtml({
    recipientEmail,
    organizationName,
    role,
    inviterName,
    inviterEmail,
    inviteLink,
  });

  const textContent = buildInvitationText({
    organizationName,
    role,
    inviterName,
    inviterEmail,
    inviteLink,
  });

  // Dispatch via Brevo
  if (!ENV_CONFIG.BREVO_API_KEY) {
    console.warn("[Brevo] BREVO_API_KEY is not defined. Skipping Brevo API dispatch.");
    return;
  }

  try {
    const senderEmail = ENV_CONFIG.BREVO_SENDER_EMAIL || "notifications@convia.app";
    const senderName = ENV_CONFIG.BREVO_SENDER_NAME || "Convia";

    const response = await brevoClient?.transactionalEmails.sendTransacEmail({
      subject: `${inviterName} invited you to join ${organizationName} on Convia`,
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: recipientEmail,
        },
      ],
      htmlContent,
      textContent,
    });

    console.log(`[Brevo] Invitation email dispatched to ${recipientEmail}. Message ID:`, response?.messageId || "sent");
  } catch (error: any) {
    console.error(`[Brevo] Failed to dispatch email to ${recipientEmail}:`, error?.message || error);
    if (error?.message?.includes("unrecognised IP address")) {
      console.warn(
        `[Brevo] Note: To enable external email dispatch from this IP, add it to authorized IPs in Brevo: https://app.brevo.com/security/authorised_ips`
      );
    }
  }
}
