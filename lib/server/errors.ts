import { z } from 'zod'

export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`).join('; ')
}
