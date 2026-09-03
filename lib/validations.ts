import { z } from 'zod';
import { parseISO } from 'date-fns';

export const vacationRequestSchema = z
  .object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().max(500, 'Reason must be less than 500 characters').optional().nullable(),
  })
  .refine((data) => parseISO(data.endDate) >= parseISO(data.startDate), {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parseISO(data.startDate) >= today;
    },
    { message: 'Cannot request vacation in the past', path: ['startDate'] },
  );

export type VacationRequestInput = z.infer<typeof vacationRequestSchema>;

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  profileImage: z.string().url().optional().nullable(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const employeeCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  departmentId: z.string().optional().nullable(),
  annualAllowance: z.number().int().min(0).max(365).default(25),
  carryOverDays: z.number().int().min(0).max(30).default(0),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

export const employeeEditSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  departmentId: z.string().optional().nullable(),
  annualAllowance: z.number().int().min(0).max(365),
  carryOverDays: z.number().int().min(0).max(30),
  active: z.boolean(),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
});

export type EmployeeEditInput = z.infer<typeof employeeEditSchema>;

export const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required').max(100),
  date: z.string().min(1, 'Date is required'),
});

export type HolidayInput = z.infer<typeof holidaySchema>;

export const companyUpdateSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Country code must be a 2-letter ISO code'),
});

export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(80),
});

export const reviewActionSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().max(500).optional().nullable(),
});

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
