import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Client name is required'),
    email: z.string().email('Valid email is required'),
    company: z.string().min(2, 'Company name is required'),
    phone: z.string().optional(),
  }),
});
