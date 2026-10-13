import { z } from 'zod';

export const patientRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gender: z.enum(['M', 'F', 'O']),
  date_of_birth: z.string().optional(),
  age: z.number().min(0).max(150).optional().nullable(),
  file_number: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  doctor: z.number().nullable().optional(),
  branch: z.number(),
});

export type PatientRegistrationFormValues = z.infer<typeof patientRegistrationSchema>;

export type RegistrationFees = {
  registration_fee: string;
  registration_item_id: number | null;
  consultation_item_id: number | null;
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}
