import { Response, NextFunction } from 'express';
import { TaskStatus, TaskPriority } from '@prisma/client';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { getActiveUserCount } from '../services/socketService';

export const getDashboardMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();

    if (user.role === 'ADMIN') {
      // Admin Dashboard Metrics
      const totalProjects = await prisma.project.count();

      // Tasks by status
      const [todoCount, inProgressCount, inReviewCount, doneCount, totalTasks] = await Promise.all([
        prisma.task.count({ where: { status: TaskStatus.TODO } }),
        prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
        prisma.task.count({ where: { status: TaskStatus.IN_REVIEW } }),
        prisma.task.count({ where: { status: TaskStatus.DONE } }),
        prisma.task.count(),
      ]);

      // Overdue tasks count
      const overdueCount = await prisma.task.count({
        where: {
          OR: [
            { isOverdue: true },
            {
              dueDate: { lt: now },
              status: { not: TaskStatus.DONE },
            },
          ],
        },
      });

      const onlineUsersCount = getActiveUserCount();

      res.status(200).json({
        success: true,
        data: {
          role: 'ADMIN',
          totalProjects,
          totalTasks,
          tasksByStatus: {
            TODO: todoCount,
            IN_PROGRESS: inProgressCount,
            IN_REVIEW: inReviewCount,
            DONE: doneCount,
          },
          overdueTaskCount: overdueCount,
          activeUsersOnline: onlineUsersCount,
        },
      });
      return;
    }

    if (user.role === 'PROJECT_MANAGER') {
      // PM Dashboard Metrics
      const [totalProjects, activeProjects, completedProjects] = await Promise.all([
        prisma.project.count({ where: { managerId: user.id } }),
        prisma.project.count({ where: { managerId: user.id, status: 'ACTIVE' } }),
        prisma.project.count({ where: { managerId: user.id, status: 'COMPLETED' } }),
      ]);

      // Tasks in their projects by priority
      const [criticalCount, highCount, mediumCount, lowCount] = await Promise.all([
        prisma.task.count({
          where: { project: { managerId: user.id }, priority: TaskPriority.CRITICAL },
        }),
        prisma.task.count({
          where: { project: { managerId: user.id }, priority: TaskPriority.HIGH },
        }),
        prisma.task.count({
          where: { project: { managerId: user.id }, priority: TaskPriority.MEDIUM },
        }),
        prisma.task.count({
          where: { project: { managerId: user.id }, priority: TaskPriority.LOW },
        }),
      ]);

      // Upcoming due dates this week (now until 7 days ahead)
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingTasksThisWeek = await prisma.task.findMany({
        where: {
          project: { managerId: user.id },
          dueDate: { gte: now, lte: oneWeekFromNow },
          status: { not: TaskStatus.DONE },
        },
        include: {
          developer: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      });

      const overdueCount = await prisma.task.count({
        where: {
          project: { managerId: user.id },
          OR: [
            { isOverdue: true },
            { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
          ],
        },
      });

      res.status(200).json({
        success: true,
        data: {
          role: 'PROJECT_MANAGER',
          projectsSummary: {
            total: totalProjects,
            active: activeProjects,
            completed: completedProjects,
          },
          tasksByPriority: {
            CRITICAL: criticalCount,
            HIGH: highCount,
            MEDIUM: mediumCount,
            LOW: lowCount,
          },
          upcomingDueDatesThisWeek: upcomingTasksThisWeek,
          overdueTaskCount: overdueCount,
        },
      });
      return;
    }

    if (user.role === 'DEVELOPER') {
      // Developer Dashboard Metrics
      const assignedTasks = await prisma.task.findMany({
        where: { developerId: user.id },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      });

      const todoCount = assignedTasks.filter((t: any) => t.status === TaskStatus.TODO).length;
      const inProgressCount = assignedTasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS).length;
      const inReviewCount = assignedTasks.filter((t: any) => t.status === TaskStatus.IN_REVIEW).length;
      const doneCount = assignedTasks.filter((t: any) => t.status === TaskStatus.DONE).length;

      const overdueCount = assignedTasks.filter(
        (t: any) => (t.isOverdue || new Date(t.dueDate) < now) && t.status !== TaskStatus.DONE
      ).length;

      res.status(200).json({
        success: true,
        data: {
          role: 'DEVELOPER',
          totalAssigned: assignedTasks.length,
          tasksByStatus: {
            TODO: todoCount,
            IN_PROGRESS: inProgressCount,
            IN_REVIEW: inReviewCount,
            DONE: doneCount,
          },
          overdueCount,
          assignedTasks,
        },
      });
      return;
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
