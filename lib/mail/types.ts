export type MailDelivery = 'sent' | 'failed' | 'not_configured';

export type OrganizationWelcomeMail = {
  organizationName: string;
  loginEmail: string;
  initialPassword: string;
  startsAt: Date;
  expiresAt: Date;
};
