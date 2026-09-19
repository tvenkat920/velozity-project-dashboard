import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';

export const getActivityFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const projectId = req.query.projectId as string | undefined;

    let whereClause: any = {};

    if (projectId) {
      whereClause.task = { projectId };
    }

    // Role-filtered access:
    if (user.role === 'PROJECT_MANAGER') {
      whereClause.task = {
        ...(whereClause.task || {}),
        project: {
          managerId: user.id,
        },
      };
    } else if (user.role === 'DEVELOPER') {
      whereClause.task = {
        ...(whereClause.task || {}),
        developerId: user.id,
      };
    }
    // ADMIN has no task filter -> sees global activity feed across all projects

    const activities = await prisma.taskActivityLog.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        task: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            projectId: true,
            developerId: true,
            project: {
              select: { id: true, name: true, managerId: true },
            },
          },
        },
      },
    });

    // Format activities for client feed
    const formattedActivities = activities.map((item: any) => ({
      id: item.id,
      taskId: item.taskId,
      taskNumber: item.task.taskNumber,
      taskTitle: item.task.title,
      projectId: item.task.projectId,
      projectName: item.task.project.name,
      projectManagerId: item.task.project.managerId,
      developerId: item.task.developerId,
      userId: item.userId,
      userName: item.user.name,
      userAvatar: item.user.avatarUrl,
      action: item.action,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      description: item.description,
      createdAt: item.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    next(error);
  }
};
