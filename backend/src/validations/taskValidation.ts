import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title is required'),
    description: z.string().optional(),
    projectId: z.string().uuid('Valid project ID required'),
    developerId: z.string().uuid().nullable().optional(),
    status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
    priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid ISO date string for due date',
    }),
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be TODO, IN_PROGRESS, IN_REVIEW, or DONE' }),
    }),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    developerId: z.string().uuid().nullable().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid ISO date string for due date',
      })
      .optional(),
  }),
});
