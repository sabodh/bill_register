import { z } from 'zod';

export const patientRegistrationSchema = z
  .object({
    registration_kind: z.enum(['NEW_OP', 'REVISIT']),
    revisit_patient_id: z.number().nullable().optional(),
    name: z.string().optional(),
    gender: z.enum(['M', 'F', 'O']),
    date_of_birth: z.string().optional(),
    age: z.number().min(0).max(150).optional().nullable(),
    file_number: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    doctor: z.number().nullable().optional(),
    branch: z.number(),
  })
  .superRefine((data, ctx) => {
    if (data.registration_kind === 'REVISIT') {
      if (!data.revisit_patient_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select an existing patient for revisit',
          path: ['revisit_patient_id'],
        });
      }
      if (!data.doctor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Doctor is required',
          path: ['doctor'],
        });
      }
      return;
    }
    if (!data.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name is required',
        path: ['name'],
      });
    }
  });

export type PatientRegistrationFormValues = z.infer<typeof patientRegistrationSchema>;

export type RegistrationFees = {
  registration_fee: string;
  registration_item_id: number | null;
  consultation_item_id: number | null;
};

export type ConsultationFeePreview = {
  doctor: number;
  patient: number | null;
  consultation_fee: string;
  consultation_fee_waived: boolean;
  revisit_period_days: number;
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
