import { Resend } from 'resend';
import { organizationWelcomeTemplate } from '@/lib/mail/organization-welcome';
import type { MailDelivery, OrganizationWelcomeMail } from '@/lib/mail/types';

export async function sendOrganizationWelcomeEmail(to: string, data: OrganizationWelcomeMail): Promise<MailDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return 'not_configured';
  try {
    const template = organizationWelcomeTemplate(data);
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({ from, to, replyTo: process.env.MAIL_REPLY_TO || undefined, ...template });
    return result.error ? 'failed' : 'sent';
  } catch {
    return 'failed';
  }
}
