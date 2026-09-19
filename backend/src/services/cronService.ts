import cron from 'node-cron';
import prisma from '../config/prisma';
import { broadcastActivity, sendRealtimeNotification } from './socketService';

export const checkOverdueTasks = async (): Promise<number> => {
  try {
    const now = new Date();

    // Query tasks where dueDate is past, not completed, and not yet flagged
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: 'DONE' },
        isOverdue: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (overdueTasks.length === 0) {
      return 0;
    }

    console.log(`[CronScheduler] Found ${overdueTasks.length} tasks past due date. Flagging as overdue...`);

    // System user or first admin for system activity log
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    const systemUserId = systemUser?.id || overdueTasks[0].project.managerId;

    for (const task of overdueTasks) {
      // 1. Update task isOverdue flag
      await prisma.task.update({
        where: { id: task.id },
        data: { isOverdue: true },
      });

      const description = `System flagged Task #${task.taskNumber} ("${task.title}") as Overdue`;

      // 2. Insert audit log
      const activityLog = await prisma.taskActivityLog.create({
        data: {
          taskId: task.id,
          userId: systemUserId,
          action: 'OVERDUE_FLAGGED',
          description,
          metadata: {
            dueDate: task.dueDate,
            flaggedAt: now,
          },
        },
      });

      // 3. Broadcast real-time activity
      broadcastActivity({
        id: activityLog.id,
        taskId: task.id,
        taskNumber: task.taskNumber,
        taskTitle: task.title,
        projectId: task.project.id,
        projectName: task.project.name,
        projectManagerId: task.project.managerId,
        developerId: task.developerId,
        userId: systemUserId,
        userName: 'System Scheduler',
        action: 'OVERDUE_FLAGGED',
        description,
        createdAt: activityLog.createdAt,
      });

      // 4. Notify Developer if assigned
      if (task.developerId) {
        const notif = await prisma.notification.create({
          data: {
            userId: task.developerId,
            title: 'Task Overdue',
            message: `Task #${task.taskNumber} ("${task.title}") is now overdue!`,
            type: 'TASK_OVERDUE',
            link: `/projects/${task.project.id}?task=${task.id}`,
          },
        });
        await sendRealtimeNotification(task.developerId, notif);
      }

      // 5. Notify Project Manager
      if (task.project.managerId) {
        const pmNotif = await prisma.notification.create({
          data: {
            userId: task.project.managerId,
            title: 'Task Overdue in Project',
            message: `Task #${task.taskNumber} in "${task.project.name}" is now overdue.`,
            type: 'TASK_OVERDUE',
            link: `/projects/${task.project.id}?task=${task.id}`,
          },
        });
        await sendRealtimeNotification(task.project.managerId, pmNotif);
      }
    }

    return overdueTasks.length;
  } catch (error) {
    console.error('[CronScheduler] Error checking overdue tasks:', error);
    return 0;
  }
};

export const initCronJobs = (): void => {
  // Run every minute: '* * * * *'
  cron.schedule('* * * * *', async () => {
    await checkOverdueTasks();
  });
  console.log('[CronScheduler] Overdue tasks background scheduler initialized (every 1 minute)');
};
