import { Response, NextFunction } from 'express';
import { TaskStatus, TaskPriority } from '@prisma/client';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { ApiError } from '../utils/errors';
import { createStatusChangeDescription } from '../utils/formatters';
import { broadcastActivity, sendRealtimeNotification } from '../services/socketService';

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { status, priority, dueDateFrom, dueDateTo, projectId, isOverdue } = req.query;

    const whereClause: any = {};

    // 1. Role enforcement
    if (user.role === 'DEVELOPER') {
      whereClause.developerId = user.id;
    } else if (user.role === 'PROJECT_MANAGER') {
      whereClause.project = {
        managerId: user.id,
      };
    }

    // 2. Query param filters
    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status as TaskStatus;
    }

    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      whereClause.priority = priority as TaskPriority;
    }

    if (projectId && typeof projectId === 'string') {
      whereClause.projectId = projectId;
    }

    if (isOverdue !== undefined) {
      whereClause.isOverdue = isOverdue === 'true';
    }

    if (dueDateFrom || dueDateTo) {
      whereClause.dueDate = {};
      if (dueDateFrom && typeof dueDateFrom === 'string') {
        whereClause.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo && typeof dueDateTo === 'string') {
        whereClause.dueDate.lte = new Date(dueDateTo);
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, managerId: true },
        },
        developer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            manager: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        developer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Role verification:
    // Developer can only view their own assigned task
    if (user.role === 'DEVELOPER' && task.developerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only view tasks assigned to you');
    }

    // PM can only view tasks within their projects
    if (user.role === 'PROJECT_MANAGER' && task.project.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only view tasks in your own projects');
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, projectId, developerId, status, priority, dueDate } = req.body;

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw ApiError.badRequest('Project not found');
    }

    if (user.role === 'PROJECT_MANAGER' && project.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only create tasks in your own projects');
    }

    if (user.role === 'DEVELOPER') {
      throw ApiError.forbidden('Forbidden: Developers cannot create tasks');
    }

    // Check if dueDate is in the past
    const parsedDueDate = new Date(dueDate);
    const isPastDue = parsedDueDate.getTime() < Date.now();

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        developerId: developerId || null,
        status: status || TaskStatus.TODO,
        priority: priority || TaskPriority.MEDIUM,
        dueDate: parsedDueDate,
        isOverdue: isPastDue && (status !== TaskStatus.DONE),
      },
      include: {
        project: true,
        developer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Record creation in activity log
    const desc = `${user.name} created Task #${task.taskNumber} ("${task.title}")`;
    const activityLog = await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: 'TASK_CREATED',
        toStatus: task.status,
        description: desc,
      },
    });

    // Notify developer if assigned
    if (task.developerId) {
      const notif = await prisma.notification.create({
        data: {
          userId: task.developerId,
          title: 'New Task Assigned',
          message: `You were assigned Task #${task.taskNumber} ("${task.title}") in project "${project.name}"`,
          type: 'TASK_ASSIGNED',
          link: `/projects/${project.id}?task=${task.id}`,
        },
      });
      await sendRealtimeNotification(task.developerId, notif);
    }

    // Broadcast activity
    broadcastActivity({
      id: activityLog.id,
      taskId: task.id,
      taskNumber: task.taskNumber,
      taskTitle: task.title,
      projectId: project.id,
      projectName: project.name,
      projectManagerId: project.managerId,
      developerId: task.developerId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      action: 'TASK_CREATED',
      toStatus: task.status,
      description: desc,
      createdAt: activityLog.createdAt,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: TaskStatus };
    const user = req.user!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        developer: true,
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // RBAC validation:
    // Developer can only update tasks assigned to them
    if (user.role === 'DEVELOPER' && task.developerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only update tasks assigned to you');
    }

    // PM can only update tasks in their projects
    if (user.role === 'PROJECT_MANAGER' && task.project.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only update tasks in your own projects');
    }

    const previousStatus = task.status;
    if (previousStatus === status) {
      res.status(200).json({ success: true, data: task });
      return;
    }

    // Update status and overdue state
    const isNowDone = status === TaskStatus.DONE;
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        ...(isNowDone && { isOverdue: false }),
      },
      include: {
        project: true,
        developer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Formatted exact requirement description:
    // "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
    const description = createStatusChangeDescription(
      user.name,
      task.taskNumber,
      previousStatus,
      status
    );

    // Persist activity log in DB (stored, NOT derived)
    const activityLog = await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: 'STATUS_CHANGED',
        fromStatus: previousStatus,
        toStatus: status,
        description,
      },
    });

    // Requirement: "When a task they own is moved to In Review, the PM receives a notification"
    if (status === TaskStatus.IN_REVIEW && task.project.managerId) {
      const pmNotif = await prisma.notification.create({
        data: {
          userId: task.project.managerId,
          title: 'Task Ready for Review',
          message: `${user.name} moved Task #${task.taskNumber} ("${task.title}") to In Review`,
          type: 'TASK_STATUS_CHANGED',
          link: `/projects/${task.project.id}?task=${task.id}`,
        },
      });
      await sendRealtimeNotification(task.project.managerId, pmNotif);
    }

    // Broadcast WebSocket real-time update
    broadcastActivity({
      id: activityLog.id,
      taskId: task.id,
      taskNumber: task.taskNumber,
      taskTitle: task.title,
      projectId: task.project.id,
      projectName: task.project.name,
      projectManagerId: task.project.managerId,
      developerId: task.developerId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      action: 'STATUS_CHANGED',
      fromStatus: previousStatus,
      toStatus: status,
      description,
      createdAt: activityLog.createdAt,
    });

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { title, description, developerId, status, priority, dueDate } = req.body;

    // Developer cannot edit task details (only status via updateTaskStatus)
    if (user.role === 'DEVELOPER') {
      throw ApiError.forbidden('Forbidden: Developers can only update task status');
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    if (user.role === 'PROJECT_MANAGER' && task.project.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only edit tasks in your own projects');
    }

    const previousDeveloperId = task.developerId;
    const previousStatus = task.status;

    let parsedDueDate: Date | undefined;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(developerId !== undefined && { developerId }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(parsedDueDate && {
          dueDate: parsedDueDate,
          isOverdue: parsedDueDate.getTime() < Date.now() && (status || task.status) !== TaskStatus.DONE,
        }),
      },
      include: {
        project: true,
        developer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // If developer assignment changed
    if (developerId && developerId !== previousDeveloperId) {
      const notif = await prisma.notification.create({
        data: {
          userId: developerId,
          title: 'Task Assigned',
          message: `You were assigned Task #${task.taskNumber} ("${updatedTask.title}")`,
          type: 'TASK_ASSIGNED',
          link: `/projects/${task.project.id}?task=${task.id}`,
        },
      });
      await sendRealtimeNotification(developerId, notif);

      const assignedLog = await prisma.taskActivityLog.create({
        data: {
          taskId: task.id,
          userId: user.id,
          action: 'ASSIGNED',
          description: `${user.name} assigned Task #${task.taskNumber} to ${updatedTask.developer?.name || 'Developer'}`,
        },
      });

      broadcastActivity({
        id: assignedLog.id,
        taskId: task.id,
        taskNumber: task.taskNumber,
        taskTitle: updatedTask.title,
        projectId: task.project.id,
        projectName: task.project.name,
        projectManagerId: task.project.managerId,
        developerId: updatedTask.developerId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        action: 'ASSIGNED',
        description: assignedLog.description,
        createdAt: assignedLog.createdAt,
      });
    }

    // If status changed
    if (status && status !== previousStatus) {
      const desc = createStatusChangeDescription(user.name, task.taskNumber, previousStatus, status);
      const statusLog = await prisma.taskActivityLog.create({
        data: {
          taskId: task.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: previousStatus,
          toStatus: status,
          description: desc,
        },
      });

      if (status === TaskStatus.IN_REVIEW && task.project.managerId) {
        const pmNotif = await prisma.notification.create({
          data: {
            userId: task.project.managerId,
            title: 'Task Ready for Review',
            message: `${user.name} moved Task #${task.taskNumber} to In Review`,
            type: 'TASK_STATUS_CHANGED',
            link: `/projects/${task.project.id}?task=${task.id}`,
          },
        });
        await sendRealtimeNotification(task.project.managerId, pmNotif);
      }

      broadcastActivity({
        id: statusLog.id,
        taskId: task.id,
        taskNumber: task.taskNumber,
        taskTitle: updatedTask.title,
        projectId: task.project.id,
        projectName: task.project.name,
        projectManagerId: task.project.managerId,
        developerId: updatedTask.developerId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        action: 'STATUS_CHANGED',
        fromStatus: previousStatus,
        toStatus: status,
        description: desc,
        createdAt: statusLog.createdAt,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    if (user.role === 'DEVELOPER') {
      throw ApiError.forbidden('Forbidden: Developers cannot delete tasks');
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    if (user.role === 'PROJECT_MANAGER' && task.project.managerId !== user.id) {
      throw ApiError.forbidden('Forbidden: You can only delete tasks in your own projects');
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
