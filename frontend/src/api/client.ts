import {
  mockUsers,
  mockProjects,
  mockTasks,
  mockActivities,
  mockNotifications,
  mockClients,
} from './mockData';
import { User, Task, TaskStatus } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL
  ? `${(import.meta as any).env.VITE_API_URL}/api`
  : '/api';

let accessToken: string | null = localStorage.getItem('velozity_access_token');
let currentUser: User | null = (() => {
  try {
    const saved = localStorage.getItem('velozity_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('velozity_access_token', token);
  } else {
    localStorage.removeItem('velozity_access_token');
  }
};

export const setCurrentUser = (user: User | null) => {
  currentUser = user;
  if (user) {
    localStorage.setItem('velozity_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('velozity_user');
  }
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

// Fallback client-side router for live Vercel frontend deployments when backend URL is not yet configured
const handleMockRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const method = (options.method || 'GET').toUpperCase();
  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth
  if (path === '/auth/login' && method === 'POST') {
    const found = mockUsers.find((u) => u.email.toLowerCase() === body.email?.toLowerCase());
    if (!found) {
      throw new Error('Invalid email or password');
    }
    const token = `jwt_mock_${found.id}_${Date.now()}`;
    setAccessToken(token);
    setCurrentUser(found);
    return { user: found, accessToken: token };
  }

  if (path === '/auth/refresh') {
    if (currentUser && accessToken) {
      return { user: currentUser, accessToken };
    }
    throw new Error('No session');
  }

  if (path === '/auth/logout') {
    setAccessToken(null);
    setCurrentUser(null);
    return { success: true };
  }

  if (path === '/auth/me') {
    if (currentUser) return { user: currentUser };
    throw new Error('Unauthorized');
  }

  // Projects
  if (path === '/projects' && method === 'GET') {
    if (currentUser?.role === 'PROJECT_MANAGER') {
      return mockProjects.filter((p) => p.managerId === currentUser?.id);
    }
    if (currentUser?.role === 'DEVELOPER') {
      const devTasks = mockTasks.filter((t) => t.developerId === currentUser?.id);
      const prjIds = new Set(devTasks.map((t) => t.projectId));
      return mockProjects.filter((p) => prjIds.has(p.id));
    }
    return mockProjects;
  }

  if (path.startsWith('/projects/') && method === 'GET') {
    const projId = path.replace('/projects/', '');
    const prj = mockProjects.find((p) => p.id === projId);
    if (!prj) throw new Error('Project not found');
    const tasks = mockTasks.filter((t) => {
      if (t.projectId !== projId) return false;
      if (currentUser?.role === 'DEVELOPER' && t.developerId !== currentUser.id) return false;
      return true;
    });
    return { ...prj, tasks };
  }

  if (path === '/projects' && method === 'POST') {
    const newPrj = {
      id: `prj_${Date.now()}`,
      name: body.name,
      description: body.description,
      status: 'ACTIVE' as any,
      clientId: body.clientId,
      managerId: currentUser?.id || 'usr_pm_01',
      manager: currentUser || mockUsers[1],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { tasks: 0 },
    };
    mockProjects.unshift(newPrj);
    return newPrj;
  }

  // Tasks
  if (path === '/tasks' && method === 'GET') {
    let result = [...mockTasks];
    if (currentUser?.role === 'DEVELOPER') {
      result = result.filter((t) => t.developerId === currentUser?.id);
    } else if (currentUser?.role === 'PROJECT_MANAGER') {
      const myPrjIds = new Set(mockProjects.filter((p) => p.managerId === currentUser?.id).map((p) => p.id));
      result = result.filter((t) => myPrjIds.has(t.projectId));
    }

    const statusFilter = params.get('status');
    const priorityFilter = params.get('priority');
    const overdueFilter = params.get('isOverdue');
    const fromFilter = params.get('dueDateFrom');
    const toFilter = params.get('dueDateTo');

    if (statusFilter && statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter && priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (overdueFilter === 'true') {
      result = result.filter((t) => t.isOverdue);
    } else if (overdueFilter === 'false') {
      result = result.filter((t) => !t.isOverdue);
    }
    if (fromFilter) {
      result = result.filter((t) => new Date(t.dueDate) >= new Date(fromFilter));
    }
    if (toFilter) {
      result = result.filter((t) => new Date(t.dueDate) <= new Date(toFilter));
    }

    return result;
  }

  if (path.startsWith('/tasks/') && path.endsWith('/status') && method === 'PATCH') {
    const taskId = path.replace('/tasks/', '').replace('/status', '');
    const task = mockTasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const oldStatus = task.status;
    task.status = body.status as TaskStatus;
    task.updatedAt = new Date().toISOString();

    const desc = `${currentUser?.name || 'User'} moved Task #${task.taskNumber} from ${oldStatus} → ${task.status}`;
    const newAct: any = {
      id: `act_${Date.now()}`,
      taskId: task.id,
      taskNumber: task.taskNumber,
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.project?.name || 'Project',
      userId: currentUser?.id || 'usr_01',
      userName: currentUser?.name || 'User',
      action: 'STATUS_CHANGED',
      description: desc,
      createdAt: new Date().toISOString(),
    };
    mockActivities.unshift(newAct);

    if (task.status === 'IN_REVIEW') {
      mockNotifications.unshift({
        id: `notif_${Date.now()}`,
        userId: task.project?.managerId || 'usr_pm_01',
        title: 'Task Ready for Review',
        message: `${currentUser?.name} moved Task #${task.taskNumber} to In Review`,
        type: 'TASK_STATUS_CHANGED',
        isRead: false,
        link: `/projects/${task.projectId}`,
        createdAt: new Date().toISOString(),
      });
    }

    return task;
  }

  // Activity
  if (path === '/activity') {
    let result = [...mockActivities];
    const projId = params.get('projectId');
    if (projId) {
      result = result.filter((a) => a.projectId === projId);
    }
    return result.slice(0, 20);
  }

  // Notifications
  if (path === '/notifications') {
    return mockNotifications;
  }

  if (path === '/notifications/unread-count') {
    return { unreadCount: mockNotifications.filter((n) => !n.isRead).length };
  }

  if (path.startsWith('/notifications/') && path.endsWith('/read') && method === 'PATCH') {
    const notifId = path.replace('/notifications/', '').replace('/read', '');
    const n = mockNotifications.find((item) => item.id === notifId);
    if (n) n.isRead = true;
    return n;
  }

  if (path === '/notifications/read-all' && method === 'PATCH') {
    mockNotifications.forEach((n) => (n.isRead = true));
    return { success: true };
  }

  // Dashboard Metrics
  if (path === '/dashboard/metrics') {
    if (currentUser?.role === 'ADMIN') {
      return {
        role: 'ADMIN',
        totalProjects: mockProjects.length,
        totalTasks: mockTasks.length,
        tasksByStatus: {
          TODO: mockTasks.filter((t) => t.status === 'TODO').length,
          IN_PROGRESS: mockTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          IN_REVIEW: mockTasks.filter((t) => t.status === 'IN_REVIEW').length,
          DONE: mockTasks.filter((t) => t.status === 'DONE').length,
        },
        overdueTaskCount: mockTasks.filter((t) => t.isOverdue).length,
        activeUsersOnline: 5,
      };
    }
    if (currentUser?.role === 'PROJECT_MANAGER') {
      const myProjects = mockProjects.filter((p) => p.managerId === currentUser?.id);
      const myTasks = mockTasks.filter((t) => myProjects.some((p) => p.id === t.projectId));
      return {
        role: 'PROJECT_MANAGER',
        projectsSummary: {
          total: myProjects.length,
          active: myProjects.length,
          completed: 0,
        },
        tasksByPriority: {
          CRITICAL: myTasks.filter((t) => t.priority === 'CRITICAL').length,
          HIGH: myTasks.filter((t) => t.priority === 'HIGH').length,
          MEDIUM: myTasks.filter((t) => t.priority === 'MEDIUM').length,
          LOW: myTasks.filter((t) => t.priority === 'LOW').length,
        },
        upcomingDueDatesThisWeek: myTasks.slice(0, 5),
        overdueTaskCount: myTasks.filter((t) => t.isOverdue).length,
      };
    }
    if (currentUser?.role === 'DEVELOPER') {
      const myTasks = mockTasks.filter((t) => t.developerId === currentUser?.id);
      return {
        role: 'DEVELOPER',
        totalAssigned: myTasks.length,
        tasksByStatus: {
          TODO: myTasks.filter((t) => t.status === 'TODO').length,
          IN_PROGRESS: myTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          IN_REVIEW: myTasks.filter((t) => t.status === 'IN_REVIEW').length,
          DONE: myTasks.filter((t) => t.status === 'DONE').length,
        },
        overdueCount: myTasks.filter((t) => t.isOverdue).length,
        assignedTasks: myTasks,
      };
    }
  }

  // Clients
  if (path === '/clients') {
    return mockClients;
  }

  // Users
  if (path === '/users') {
    return mockUsers;
  }

  return { success: true };
};

export const apiClient = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);

    // If endpoint returned 404 or failed on static host, invoke client mock router
    if (response.status === 404) {
      return handleMockRequest(endpoint, options);
    }

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      // Attempt silent refresh
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!refreshRes.ok) {
          throw new Error('Refresh token invalid');
        }

        const refreshData = await refreshRes.json();
        const newToken = refreshData.data?.accessToken;
        setAccessToken(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...config, headers });
        const retryData = await retryRes.json();
        return retryData.data !== undefined ? retryData.data : retryData;
      } catch {
        return handleMockRequest(endpoint, options);
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw data.error || new Error(data.message || 'API request failed');
    }
    return data.data !== undefined ? data.data : data;
  } catch (err) {
    // Network failure (e.g. backend offline or static Vercel deployment) -> fallback to mock router
    return handleMockRequest(endpoint, options);
  }
};
