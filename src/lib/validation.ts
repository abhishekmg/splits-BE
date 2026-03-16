import { z } from 'zod';

// Auth
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  display_name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Groups
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

// Invitations
export const sendInvitationSchema = z.object({
  group_id: z.string().uuid(),
  email: z.string().email(),
});

export const respondInvitationSchema = z.object({
  status: z.enum(['accepted', 'declined']),
});

// Expenses
const splitDetailSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

const currencySchema = z.string().length(3, 'Currency must be a 3-letter ISO 4217 code').toUpperCase();

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  currency: currencySchema,
  split_type: z.enum(['equal', 'percentage', 'exact']),
  splits: z.array(splitDetailSchema).min(1, 'At least one split is required'),
});

export const updateExpenseSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  currency: currencySchema.optional(),
  split_type: z.enum(['equal', 'percentage', 'exact']).optional(),
  splits: z.array(splitDetailSchema).min(1).optional(),
});

// Settlements
export const createSettlementSchema = z.object({
  paid_to: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: currencySchema,
  note: z.string().max(200).optional(),
});

// Pagination
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Helper to parse and validate
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { error: messages };
  }
  return { data: result.data };
}

export function parseQuery<T>(schema: z.ZodSchema<T>, params: URLSearchParams): { data: T } | { error: string } {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => { obj[key] = value; });
  return parseBody(schema, obj);
}
