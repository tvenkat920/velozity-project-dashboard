import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { ApiError } from '../utils/errors';

export const getProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    let whereClause: any = {};

    if (user.role === 'PROJECT_MANAGER') {
      whereClause = { managerId: user.id };
    } else if (user.role === 'DEVELOPER') {
      whereClause = {
        tasks: {
          some: { developerId: user.id },
        },
      };
    }
    // ADMIN has empty whereClause -> sees all projects

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        manager: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        tasks: {
          where: user.role === 'DEVELOPER' ? { developerId: user.id } : {},
          include: {
            developer: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Role check
    if (user.role === 'PROJECT_MANAGER' && project.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only view projects you created');
    }

    if (user.role === 'DEVELOPER') {
      const hasAssignedTask = project.tasks.some((t: any) => t.developerId === user.id);
      if (!hasAssignedTask) {
        throw ApiError.forbidden('Forbidden: You can only view projects with tasks assigned to you');
      }
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { name, description, clientId, managerId, status } = req.body;

    // PM can only create projects assigned to themselves
    const effectiveManagerId = user.role === 'PROJECT_MANAGER' ? user.id : managerId || user.id;

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw ApiError.badRequest('Referenced client does not exist');
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        managerId: effectiveManagerId,
        status: status || 'ACTIVE',
      },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { name, description, clientId, managerId, status } = req.body;

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Project not found');
    }

    if (user.role === 'PROJECT_MANAGER' && existing.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only update projects you created');
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(clientId && { clientId }),
        ...(user.role === 'ADMIN' && managerId && { managerId }),
        ...(status && { status }),
      },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Project not found');
    }

    if (user.role === 'PROJECT_MANAGER' && existing.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only delete projects you created');
    }

    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
