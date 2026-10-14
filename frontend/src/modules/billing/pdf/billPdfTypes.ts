export type BillPdfLine = {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type BillPdfPatient = {
  name: string;
  uhid: string;
  phone: string;
  ageSex: string;
  address: string;
};

export type BillPdfSnapshot = {
  bill_number: string;
  hospital_name: string;
  doctor_name: string;
  sample_collected_at: string;
  patient: BillPdfPatient;
  lines: BillPdfLine[];
  subtotal: number;
  discount_applied: number;
  total: number;
  advance_paid: number;
  balance_due: number;
  payment_method: string;
  payment_transaction_id: string;
  notes: string;
};

export type BillPdfPageSize = 'A4' | 'A5';
