import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './tokenService';
import prisma from '../config/prisma';
import { AuthUser } from '../types';

let io: Server | null = null;

// Track active users: userId -> count of active sockets
const activeUserSockets = new Map<string, Set<string>>();
// Map socketId -> AuthUser
const socketUserMap = new Map<string, AuthUser>();

export interface ActivityBroadcastPayload {
  id: string;
  taskId: string;
  taskNumber: number;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectManagerId: string;
  developerId?: string | null;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  description: string;
  createdAt: string | Date;
}

export const initSocket = (httpServer: HttpServer, frontendUrl: string): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: frontendUrl || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Socket authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: AuthUser = socket.data.user;
    if (!user) return;

    socketUserMap.set(socket.id, user);

    // Track user presence
    if (!activeUserSockets.has(user.id)) {
      activeUserSockets.set(user.id, new Set());
    }
    activeUserSockets.get(user.id)!.add(socket.id);

    // Join personal user room (for notifications)
    socket.join(`user:${user.id}`);

    // Join role-specific rooms
    if (user.role === 'ADMIN') {
      socket.join('role:admin');
    } else if (user.role === 'PROJECT_MANAGER') {
      socket.join('role:pm');
      socket.join(`pm:${user.id}`);
    } else if (user.role === 'DEVELOPER') {
      socket.join('role:dev');
      socket.join(`dev:${user.id}`);
    }

    // Broadcast updated presence to all admins
    broadcastPresence();

    // Handle project room join/leave when user navigates
    socket.on('join:project', (projectId: string) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on('leave:project', (projectId: string) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      socketUserMap.delete(socket.id);
      const userSockets = activeUserSockets.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUserSockets.delete(user.id);
        }
      }
      broadcastPresence();
    });
  });

  return io;
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const getActiveUserCount = (): number => {
  return activeUserSockets.size;
};

export const broadcastPresence = (): void => {
  if (!io) return;
  const count = activeUserSockets.size;
  // Send presence to everyone or role:admin for dashboard live display
  io.emit('presence:update', {
    onlineCount: count,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast activity strictly honoring role filtering:
 * 1. Admin sees activity across all projects (single global feed)
 * 2. PM sees activity ONLY from their own projects
 * 3. Developer sees activity ONLY on tasks assigned to them
 * 4. All users currently viewing that specific project see the update
 */
export const broadcastActivity = (activity: ActivityBroadcastPayload): void => {
  if (!io) return;

  // 1. Users actively viewing the project
  io.to(`project:${activity.projectId}`).emit('activity:new', activity);
  io.to(`project:${activity.projectId}`).emit('task:statusUpdated', {
    taskId: activity.taskId,
    status: activity.toStatus,
    updatedBy: activity.userName,
    description: activity.description,
  });

  // 2. Admins receive all activity globally
  io.to('role:admin').emit('activity:new', activity);

  // 3. Project Manager receives activity if this is their project
  if (activity.projectManagerId) {
    io.to(`pm:${activity.projectManagerId}`).emit('activity:new', activity);
  }

  // 4. Developer receives activity if this task is assigned to them
  if (activity.developerId) {
    io.to(`dev:${activity.developerId}`).emit('activity:new', activity);
  }
};

/**
 * Send in-app notification in real-time to a specific user
 */
export const sendRealtimeNotification = async (
  userId: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
    createdAt: Date | string;
  }
): Promise<void> => {
  if (!io) return;

  // Emit notification to user's private room
  io.to(`user:${userId}`).emit('notification:new', notification);

  // Emit updated unread count
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    io.to(`user:${userId}`).emit('notification:count', { unreadCount });
  } catch (err) {
    // Non-fatal error
  }
};
