export interface InvitationTemplateParams {
  recipientEmail: string;
  organizationName: string;
  role: string;
  inviterName: string;
  inviterEmail: string;
  inviteLink: string;
}

/**
 * Builds a clean, modern, professional HTML email template for workspace invitations.
 */
export function buildInvitationHtml(params: InvitationTemplateParams): string {
  const { organizationName, role, inviterName, inviterEmail, inviteLink } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 24px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 36px; height: 36px; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 8px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: 800; font-size: 20px;">
                          C
                        </td>
                        <td style="padding-left: 12px; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                          Convia
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; background-color: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px;">
                      Workspace Invite
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; line-height: 1.35; color: #0f172a; letter-spacing: -0.02em;">
                You've been invited to join <span style="color: #4f46e5;">${organizationName}</span>
              </h1>
              
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">
                <strong>${inviterName}</strong> (${inviterEmail}) has invited you to collaborate in their workspace on Convia as a <strong>${role}</strong>.
              </p>

              <!-- Workspace Details Box -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="margin: 0 0 28px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b; width: 110px;">Workspace</td>
                        <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${organizationName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Assigned Role</td>
                        <td style="padding: 4px 0;">
                          <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px;">
                            ${role}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Invited By</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #0f172a;">${inviterName} &lt;${inviterEmail}&gt;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px;">
                <tr>
                  <td align="center" style="border-radius: 8px; background: #4f46e5;">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #4f46e5;">
                      Accept Invitation &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #64748b;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <div style="margin: 0 0 24px; padding: 12px 14px; background-color: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 12px; color: #334155; word-break: break-all;">
                ${inviteLink}
              </div>

              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                &bull; This invitation link is unique to you and will expire in 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #94a3b8; text-align: center;">
                Convia &bull; AI-Native Conversational Form Builder
              </p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; text-align: center;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Builds plain text email content as fallback.
 */
export function buildInvitationText(params: {
  organizationName: string;
  role: string;
  inviterName: string;
  inviterEmail: string;
  inviteLink: string;
}): string {
  return `You've been invited to join ${params.organizationName} on Convia!

${params.inviterName} (${params.inviterEmail}) has invited you to collaborate as a ${params.role}.

Accept your invitation here:
${params.inviteLink}

Note: This invitation link is valid for 7 days.
If you were not expecting this invitation, you can safely ignore this email.

---
Convia — AI-Native Form Builder
`;
}
