import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    description: z.string().optional(),
    clientId: z.string().uuid('Valid client ID is required'),
    managerId: z.string().uuid('Valid project manager ID is required').optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    clientId: z.string().uuid().optional(),
    managerId: z.string().uuid().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});
