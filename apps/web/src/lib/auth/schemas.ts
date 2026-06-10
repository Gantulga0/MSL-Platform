import { z } from 'zod';

/**
 * Client-side auth form validation (Zod v4). All messages are authored in
 * Mongolian via the unified `error` parameter; only top-level formats are used
 * (`z.email()`, `z.string()`), never the deprecated `message` / `invalid_type_error`
 * / `required_error` / `errorMap` APIs.
 */
export const loginSchema = z.object({
  identifier: z
    .string({ error: 'Имэйл эсвэл хэрэглэгчийн нэрээ оруулна уу.' })
    .trim()
    .min(1, { error: 'Имэйл эсвэл хэрэглэгчийн нэрээ оруулна уу.' }),
  password: z
    .string({ error: 'Нууц үгээ оруулна уу.' })
    .min(1, { error: 'Нууц үгээ оруулна уу.' }),
});

export const registerSchema = z.object({
  displayName: z
    .string({ error: 'Харагдах нэрээ оруулна уу.' })
    .trim()
    .min(2, { error: 'Нэр хамгийн багадаа 2 тэмдэгт байх ёстой.' })
    .max(120, { error: 'Нэр хэт урт байна.' }),
  email: z.email({ error: 'И-мэйл хаяг буруу байна.' }),
  password: z
    .string({ error: 'Нууц үгээ оруулна уу.' })
    .min(8, { error: 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.' })
    .regex(/[A-Za-z]/, { error: 'Нууц үг үсэг агуулсан байх ёстой.' })
    .regex(/[0-9]/, { error: 'Нууц үг тоо агуулсан байх ёстой.' }),
  consent: z.literal(true, {
    error: 'Үргэлжлүүлэхийн тулд нөхцөлийг зөвшөөрнө үү.',
  }),
});

export type LoginFields = z.infer<typeof loginSchema>;
export type RegisterFields = z.infer<typeof registerSchema>;

/**
 * Collapse a {@link z.ZodError} into a `{ field: firstMessage }` map for inline,
 * text-based field errors (errors conveyed by text, never colour alone — NFR-01).
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in map)) map[key] = issue.message;
  }
  return map;
}
