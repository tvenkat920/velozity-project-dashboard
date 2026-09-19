export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string | null;
  createdAt: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  clientId: string;
  client?: Client;
  managerId: string;
  manager?: User;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  projectId: string;
  project?: {
    id: string;
    name: string;
    managerId?: string;
  };
  developerId?: string | null;
  developer?: User | null;
  activityLogs?: ActivityItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  taskId: string;
  taskNumber: number;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectManagerId?: string;
  developerId?: string | null;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  action: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  description: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface AdminMetrics {
  role: 'ADMIN';
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
  overdueTaskCount: number;
  activeUsersOnline: number;
}

export interface PMMetrics {
  role: 'PROJECT_MANAGER';
  projectsSummary: {
    total: number;
    active: number;
    completed: number;
  };
  tasksByPriority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  upcomingDueDatesThisWeek: Task[];
  overdueTaskCount: number;
}

export interface DeveloperMetrics {
  role: 'DEVELOPER';
  totalAssigned: number;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
  overdueCount: number;
  assignedTasks: Task[];
}

export type DashboardMetrics = AdminMetrics | PMMetrics | DeveloperMetrics;
