export type ReceiptLine = {
  service: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
};

export type ReceiptData = {
  reference: string;
  createdAt: string;

  company: {
    name: string;
    tagline?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
    logo?: string | null;
  };

  client: {
    name: string;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  };

  lines: ReceiptLine[];

  payment: {
    amount: number;
    method: string;
  };

  total: number;
  paid: number;
  remaining: number;

  /**
   * Montant réellement remis par le client.
   * Exemple : prestation 93 000 FCFA, client remet 100 000 FCFA.
   */
  cashGiven?: number | null;

  /**
   * Montant total de la monnaie due au client.
   * Exemple : 100 000 - 93 000 = 7 000 FCFA.
   */
  changeDue?: number | null;

  /**
   * Montant de monnaie effectivement rendu au client.
   */
  changeReturned?: number | null;

  /**
   * Montant de monnaie qui reste encore à remettre au client.
   */
  changeRemaining?: number | null;

  /**
   * Ancien champ conservé pour compatibilité
   * avec les reçus existants.
   */
  change?: number | null;
};