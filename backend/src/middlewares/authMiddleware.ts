import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { verifyAccessToken } from '../services/tokenService';
import { ApiError } from '../utils/errors';
import prisma from '../config/prisma';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      throw ApiError.unauthorized('Token expired or invalid');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found or account deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

/**
 * Enforces project-level authorization:
 * - Admin: can view and manage any project
 * - Project Manager: can ONLY view and manage projects they created (managerId === user.id)
 * - Developer: can ONLY view projects where they have assigned tasks
 */
export const checkProjectAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(ApiError.unauthorized());

    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return next(ApiError.badRequest('Project ID required'));

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          select: { developerId: true },
        },
      },
    });

    if (!project) {
      return next(ApiError.notFound('Project not found'));
    }

    if (user.role === 'ADMIN') {
      return next();
    }

    if (user.role === 'PROJECT_MANAGER') {
      if (project.managerId !== user.id) {
        return next(
          ApiError.forbidden('Forbidden: Project Managers can only access projects they created')
        );
      }
      return next();
    }

    if (user.role === 'DEVELOPER') {
      const isAssigned = project.tasks.some((t: any) => t.developerId === user.id);
      if (!isAssigned) {
        return next(
          ApiError.forbidden('Forbidden: Developers can only access projects with assigned tasks')
        );
      }
      return next();
    }

    return next(ApiError.forbidden('Forbidden: Unauthorized role'));
  } catch (err) {
    next(err);
  }
};

/**
 * Enforces task-level authorization:
 * - Admin: full access to any task
 * - Project Manager: only tasks in projects they manage
 * - Developer: only tasks assigned to them, and can only update status
 */
export const checkTaskAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(ApiError.unauthorized());

    const taskId = req.params.taskId || req.params.id;
    if (!taskId) return next(ApiError.badRequest('Task ID required'));

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      return next(ApiError.notFound('Task not found'));
    }

    if (user.role === 'ADMIN') {
      return next();
    }

    if (user.role === 'PROJECT_MANAGER') {
      if (task.project.managerId !== user.id) {
        return next(
          ApiError.forbidden('Forbidden: Project Managers can only access tasks in their own projects')
        );
      }
      return next();
    }

    if (user.role === 'DEVELOPER') {
      if (task.developerId !== user.id) {
        return next(
          ApiError.forbidden('Forbidden: Developers can only view or modify tasks assigned to them')
        );
      }
      return next();
    }

    return next(ApiError.forbidden('Forbidden: Unauthorized role'));
  } catch (err) {
    next(err);
  }
};
