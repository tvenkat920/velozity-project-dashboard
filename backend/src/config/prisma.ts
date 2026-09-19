import net from 'net';
import { PrismaClient } from '@prisma/client';
import { createInitialStore, MockDataStore } from './mockDb';

let realPrisma: PrismaClient | null = null;
let useMock = true; // Defaults to mock unless Postgres port is open

// Quick 300ms TCP probe to test if PostgreSQL server is listening
const probePostgres = async (port = 5432, host = 'localhost'): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(300);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

probePostgres().then(async (isOpen) => {
  if (isOpen && process.env.USE_MOCK_DB !== 'true') {
    try {
      realPrisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
      await realPrisma.$connect();
      useMock = false;
      console.log('✅ Connected successfully to PostgreSQL via Prisma Client');
    } catch (e) {
      console.warn('⚠️  PostgreSQL connection failed. Using in-memory seeded store.');
      useMock = true;
    }
  } else {
    console.log('📦 Running with in-memory seeded database (PostgreSQL container not detected on localhost:5432).');
  }
});

let store: MockDataStore = createInitialStore();

// Helper to filter items based on where conditions
const matchesWhere = (item: any, where: any): boolean => {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === 'OR' && Array.isArray(val)) {
      if (!val.some((sub) => matchesWhere(item, sub))) return false;
      continue;
    }
    if (key === 'AND' && Array.isArray(val)) {
      if (!val.every((sub) => matchesWhere(item, sub))) return false;
      continue;
    }

    if (typeof val === 'object' && val !== null) {
      // Comparison operator e.g. { not: 'DONE' }, { lt: Date }, { gte: Date }
      if ('not' in val) {
        if (item[key] === (val as any).not) return false;
      }
      if ('lt' in val) {
        if (!(new Date(item[key]) < new Date((val as any).lt))) return false;
      }
      if ('lte' in val) {
        if (!(new Date(item[key]) <= new Date((val as any).lte))) return false;
      }
      if ('gt' in val) {
        if (!(new Date(item[key]) > new Date((val as any).gt))) return false;
      }
      if ('gte' in val) {
        if (!(new Date(item[key]) >= new Date((val as any).gte))) return false;
      }
      if ('some' in val) {
        const subList = item[key] || [];
        if (!subList.some((s: any) => matchesWhere(s, val.some))) return false;
      }
      // Nested relation check e.g. project: { managerId: user.id }
      if (!('not' in val) && !('lt' in val) && !('lte' in val) && !('gt' in val) && !('gte' in val) && !('some' in val)) {
        if (key === 'project') {
          const prj = store.projects.find((p) => p.id === item.projectId);
          if (!prj || !matchesWhere(prj, val)) return false;
        } else if (key === 'task') {
          const tsk = store.tasks.find((t) => t.id === item.taskId);
          if (!tsk || !matchesWhere(tsk, val)) return false;
        }
      }
    } else {
      if (typeof item[key] === 'string' && typeof val === 'string') {
        if (item[key].toLowerCase() !== val.toLowerCase()) return false;
      } else if (item[key] !== val) {
        return false;
      }
    }
  }
  return true;
};

// In-Memory Mock Adapter
const mockAdapter = {
  user: {
    findUnique: async ({ where }: any) => {
      return store.users.find((u) => matchesWhere(u, where)) || null;
    },
    findFirst: async ({ where }: any) => {
      return store.users.find((u) => matchesWhere(u, where)) || null;
    },
    findMany: async ({ where, select }: any) => {
      let results = store.users.filter((u) => matchesWhere(u, where));
      return results.map((u) => {
        const copy = { ...u };
        if (select?._count?.select) {
          copy._count = {
            assignedTasks: store.tasks.filter((t) => t.developerId === u.id).length,
            managedProjects: store.projects.filter((p) => p.managerId === u.id).length,
          };
        }
        return copy;
      });
    },
    create: async ({ data }: any) => {
      const newUser = { id: `usr_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      store.users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: any) => {
      const idx = store.users.findIndex((u) => matchesWhere(u, where));
      if (idx !== -1) {
        store.users[idx] = { ...store.users[idx], ...data, updatedAt: new Date() };
        return store.users[idx];
      }
      return null;
    },
    deleteMany: async () => {
      store.users = [];
      return { count: 0 };
    },
  },

  client: {
    findUnique: async ({ where }: any) => {
      return store.clients.find((c) => matchesWhere(c, where)) || null;
    },
    findMany: async ({ orderBy }: any) => {
      return store.clients.map((c) => ({
        ...c,
        _count: {
          projects: store.projects.filter((p) => p.clientId === c.id).length,
        },
      }));
    },
    create: async ({ data }: any) => {
      const newClient = { id: `clt_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
      store.clients.push(newClient);
      return newClient;
    },
    deleteMany: async () => {
      store.clients = [];
      return { count: 0 };
    },
  },

  project: {
    findUnique: async ({ where, include }: any) => {
      const p = store.projects.find((pr) => matchesWhere(pr, where));
      if (!p) return null;
      const copy = { ...p };
      if (include?.client) copy.client = store.clients.find((c) => c.id === p.clientId) || null;
      if (include?.manager) copy.manager = store.users.find((u) => u.id === p.managerId) || null;
      if (include?.tasks) {
        let ts = store.tasks.filter((t) => t.projectId === p.id);
        if (include.tasks.where?.developerId) {
          ts = ts.filter((t) => t.developerId === include.tasks.where.developerId);
        }
        copy.tasks = ts.map((t) => ({
          ...t,
          developer: store.users.find((u) => u.id === t.developerId) || null,
        }));
      }
      return copy;
    },
    findMany: async ({ where, include }: any) => {
      let results = store.projects.filter((p) => {
        if (where?.managerId && p.managerId !== where.managerId) return false;
        if (where?.tasks?.some) {
          const prjTasks = store.tasks.filter((t) => t.projectId === p.id);
          if (!prjTasks.some((t) => matchesWhere(t, where.tasks.some))) return false;
        }
        return true;
      });

      return results.map((p) => {
        const copy: any = { ...p };
        if (include?.client) copy.client = store.clients.find((c) => c.id === p.clientId) || null;
        if (include?.manager) copy.manager = store.users.find((u) => u.id === p.managerId) || null;
        if (include?._count?.select?.tasks) {
          copy._count = { tasks: store.tasks.filter((t) => t.projectId === p.id).length };
        }
        return copy;
      });
    },
    count: async ({ where }: any) => {
      return store.projects.filter((p) => matchesWhere(p, where)).length;
    },
    create: async ({ data, include }: any) => {
      const newPrj = {
        id: `prj_${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.projects.push(newPrj);
      const copy: any = { ...newPrj };
      if (include?.client) copy.client = store.clients.find((c) => c.id === newPrj.clientId);
      if (include?.manager) copy.manager = store.users.find((u) => u.id === newPrj.managerId);
      return copy;
    },
    update: async ({ where, data, include }: any) => {
      const idx = store.projects.findIndex((p) => matchesWhere(p, where));
      if (idx !== -1) {
        store.projects[idx] = { ...store.projects[idx], ...data, updatedAt: new Date() };
        const copy: any = { ...store.projects[idx] };
        if (include?.client) copy.client = store.clients.find((c) => c.id === copy.clientId);
        if (include?.manager) copy.manager = store.users.find((u) => u.id === copy.managerId);
        return copy;
      }
      return null;
    },
    delete: async ({ where }: any) => {
      const idx = store.projects.findIndex((p) => matchesWhere(p, where));
      if (idx !== -1) {
        const deleted = store.projects.splice(idx, 1)[0];
        return deleted;
      }
      return null;
    },
    deleteMany: async () => {
      store.projects = [];
      return { count: 0 };
    },
  },

  task: {
    findUnique: async ({ where, include }: any) => {
      const t = store.tasks.find((tk) => matchesWhere(tk, where));
      if (!t) return null;
      const copy: any = { ...t };
      if (include?.project) {
        const prj = store.projects.find((p) => p.id === t.projectId);
        copy.project = prj ? { ...prj, manager: store.users.find((u) => u.id === prj.managerId) } : null;
      }
      if (include?.developer) copy.developer = store.users.find((u) => u.id === t.developerId) || null;
      if (include?.activityLogs) {
        copy.activityLogs = store.taskActivityLogs
          .filter((a) => a.taskId === t.id)
          .map((a) => ({ ...a, user: store.users.find((u) => u.id === a.userId) }));
      }
      return copy;
    },
    findMany: async ({ where, include, orderBy, take }: any) => {
      let results = store.tasks.filter((t) => matchesWhere(t, where));

      if (orderBy) {
        results.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      }

      if (take) {
        results = results.slice(0, take);
      }

      return results.map((t) => {
        const copy: any = { ...t };
        if (include?.project) {
          const prj = store.projects.find((p) => p.id === t.projectId);
          copy.project = prj ? { id: prj.id, name: prj.name, managerId: prj.managerId } : null;
        }
        if (include?.developer) copy.developer = store.users.find((u) => u.id === t.developerId) || null;
        return copy;
      });
    },
    count: async ({ where }: any) => {
      return store.tasks.filter((t) => matchesWhere(t, where)).length;
    },
    create: async ({ data, include }: any) => {
      const maxNum = store.tasks.reduce((max, t) => Math.max(max, t.taskNumber || 0), 0);
      const newTask = {
        id: `tsk_${Date.now()}`,
        taskNumber: maxNum + 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.tasks.push(newTask);
      const copy: any = { ...newTask };
      if (include?.project) copy.project = store.projects.find((p) => p.id === newTask.projectId);
      if (include?.developer) copy.developer = store.users.find((u) => u.id === newTask.developerId);
      return copy;
    },
    update: async ({ where, data, include }: any) => {
      const idx = store.tasks.findIndex((t) => matchesWhere(t, where));
      if (idx !== -1) {
        store.tasks[idx] = { ...store.tasks[idx], ...data, updatedAt: new Date() };
        const copy: any = { ...store.tasks[idx] };
        if (include?.project) copy.project = store.projects.find((p) => p.id === copy.projectId);
        if (include?.developer) copy.developer = store.users.find((u) => u.id === copy.developerId);
        return copy;
      }
      return null;
    },
    delete: async ({ where }: any) => {
      const idx = store.tasks.findIndex((t) => matchesWhere(t, where));
      if (idx !== -1) {
        return store.tasks.splice(idx, 1)[0];
      }
      return null;
    },
    deleteMany: async () => {
      store.tasks = [];
      return { count: 0 };
    },
  },

  taskActivityLog: {
    findMany: async ({ where, take, orderBy, include }: any) => {
      let results = store.taskActivityLogs.filter((a) => matchesWhere(a, where));

      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (take) {
        results = results.slice(0, take);
      }

      return results.map((act) => {
        const copy: any = { ...act };
        if (include?.user) copy.user = store.users.find((u) => u.id === act.userId);
        if (include?.task) {
          const tsk = store.tasks.find((t) => t.id === act.taskId);
          const prj = tsk ? store.projects.find((p) => p.id === tsk.projectId) : null;
          copy.task = tsk ? { ...tsk, project: prj } : null;
        }
        return copy;
      });
    },
    create: async ({ data }: any) => {
      const newLog = {
        id: `act_${Date.now()}`,
        ...data,
        createdAt: new Date(),
      };
      store.taskActivityLogs.unshift(newLog);
      return newLog;
    },
    deleteMany: async () => {
      store.taskActivityLogs = [];
      return { count: 0 };
    },
  },

  notification: {
    findUnique: async ({ where }: any) => {
      return store.notifications.find((n) => matchesWhere(n, where)) || null;
    },
    findMany: async ({ where, take }: any) => {
      let results = store.notifications.filter((n) => matchesWhere(n, where));
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (take) results = results.slice(0, take);
      return results;
    },
    count: async ({ where }: any) => {
      return store.notifications.filter((n) => matchesWhere(n, where)).length;
    },
    create: async ({ data }: any) => {
      const newNotif = {
        id: `notif_${Date.now()}`,
        ...data,
        isRead: false,
        createdAt: new Date(),
      };
      store.notifications.unshift(newNotif);
      return newNotif;
    },
    update: async ({ where, data }: any) => {
      const idx = store.notifications.findIndex((n) => matchesWhere(n, where));
      if (idx !== -1) {
        store.notifications[idx] = { ...store.notifications[idx], ...data };
        return store.notifications[idx];
      }
      return null;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      store.notifications.forEach((n, i) => {
        if (matchesWhere(n, where)) {
          store.notifications[i] = { ...n, ...data };
          count++;
        }
      });
      return { count };
    },
    deleteMany: async () => {
      store.notifications = [];
      return { count: 0 };
    },
  },

  $connect: async () => {
    if (realPrisma) {
      await realPrisma.$connect();
    }
  },
  $disconnect: async () => {
    if (realPrisma) {
      await realPrisma.$disconnect();
    }
  },
};

// Dynamic client proxy: if real PostgreSQL is connected, use realPrisma; otherwise use mockAdapter
const prisma: any = new Proxy(
  {},
  {
    get(target, prop) {
      if (!useMock && realPrisma) {
        return (realPrisma as any)[prop];
      }
      return (mockAdapter as any)[prop];
    },
  }
);

export default prisma;
