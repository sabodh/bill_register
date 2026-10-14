import type { BillDetailRecord, Patient } from '../../../api/types/models';
import { billBalanceDue } from '../billPayment';
import type { BillPdfSnapshot } from './billPdfTypes';
import { formatPatientAgeSex } from './billPdfFormat';

function patientBlock(patient: Patient | null): BillPdfSnapshot['patient'] {
  if (!patient) {
    return { name: '—', uhid: '—', phone: '—', ageSex: '—', address: '—' };
  }
  return {
    name: patient.name,
    uhid: patient.uhid,
    phone: patient.phone || '—',
    ageSex: formatPatientAgeSex(patient.gender, patient.age_years),
    address: patient.address || '—',
  };
}

export function billPdfSnapshotFromDetail(bill: BillDetailRecord): BillPdfSnapshot {
  const balanceDue = billBalanceDue(bill);
  return {
    bill_number: bill.bill_number,
    hospital_name: bill.hospital_name?.trim() || '—',
    doctor_name: bill.doctor_name?.trim() || '—',
    sample_collected_at: bill.sample_collected_at,
    patient: patientBlock(bill.patient_detail),
    lines: bill.lines.map((line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unit_price: Number(line.unit_price),
      amount: Number(line.amount),
    })),
    subtotal: Number(bill.subtotal_amount),
    discount_applied: Number(bill.discount_applied),
    total: Number(bill.total_amount),
    advance_paid: Number(bill.advance_paid ?? 0),
    balance_due: balanceDue,
    payment_method: bill.payment_method,
    payment_transaction_id: bill.payment_transaction_id ?? '',
    notes: bill.notes ?? '',
  };
}
