import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username min 3 chars')
    .max(20, 'Username max 20 chars')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username: letters, numbers, _ only'),
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Password min 6 chars'),
});

export const LoginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});
