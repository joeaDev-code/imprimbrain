import type { OrganizationWelcomeMail } from '@/lib/mail/types';

function date(value: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(value);
}

export function organizationWelcomeTemplate(data: OrganizationWelcomeMail) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/login`;
  const text = [
    `Bienvenue sur Imprim’Brain, ${data.organizationName}.`, '',
    `Connexion : ${loginUrl}`, `E-mail : ${data.loginEmail}`, `Mot de passe initial : ${data.initialPassword}`, '',
    'Abonnement initial : 10 000 FCFA pour 1 mois.', `Début : ${date(data.startsAt)}`, `Expiration : ${date(data.expiresAt)}`,
  ].join('\n');
  return {
    subject: `Bienvenue sur Imprim’Brain – ${data.organizationName}`,
    text,
    html: `<main style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a"><h1>Bienvenue sur Imprim’Brain</h1><p>L’organisation <strong>${data.organizationName}</strong> a été créée.</p><p><strong>Connexion :</strong> <a href="${loginUrl}">${loginUrl}</a><br/><strong>E-mail :</strong> ${data.loginEmail}<br/><strong>Mot de passe initial :</strong> ${data.initialPassword}</p><p><strong>Abonnement initial :</strong> 10&nbsp;000 FCFA pour 1 mois<br/>Du ${date(data.startsAt)} au ${date(data.expiresAt)}.</p><p>Veuillez modifier ce mot de passe après votre première connexion.</p></main>`,
  };
}
