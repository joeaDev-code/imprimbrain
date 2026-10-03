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

  cashGiven?: number | null;
  change?: number | null;
};