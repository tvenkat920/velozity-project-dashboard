import bcrypt from 'bcryptjs';
import { Role, TaskStatus, TaskPriority, ProjectStatus, NotificationType } from '@prisma/client';

export interface MockDataStore {
  users: any[];
  clients: any[];
  projects: any[];
  tasks: any[];
  taskActivityLogs: any[];
  notifications: any[];
}

export const createInitialStore = (): MockDataStore => {
  const hashedPassword = bcrypt.hashSync('Password123!', 10);
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const twoDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fiveDaysAhead = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const tenDaysAhead = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // 1. Users: 1 Admin, 2 PMs, 4 Developers
  const users = [
    {
      id: 'usr_admin_01',
      name: 'Sarah Admin',
      email: 'admin@velozity.com',
      passwordHash: hashedPassword,
      role: 'ADMIN' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_pm_01',
      name: 'Ravi Sharma',
      email: 'ravi.pm@velozity.com',
      passwordHash: hashedPassword,
      role: 'PROJECT_MANAGER' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_pm_02',
      name: 'Elena Vance',
      email: 'elena.pm@velozity.com',
      passwordHash: hashedPassword,
      role: 'PROJECT_MANAGER' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_dev_01',
      name: 'Alex Chen',
      email: 'alex.dev@velozity.com',
      passwordHash: hashedPassword,
      role: 'DEVELOPER' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_dev_02',
      name: 'Marcus Miller',
      email: 'marcus.dev@velozity.com',
      passwordHash: hashedPassword,
      role: 'DEVELOPER' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_dev_03',
      name: 'Priya Patel',
      email: 'priya.dev@velozity.com',
      passwordHash: hashedPassword,
      role: 'DEVELOPER' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_dev_04',
      name: 'David Kim',
      email: 'david.dev@velozity.com',
      passwordHash: hashedPassword,
      role: 'DEVELOPER' as Role,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 2. Clients
  const clients = [
    {
      id: 'clt_01',
      name: 'Acme Financial Group',
      email: 'contact@acmefinancial.com',
      company: 'Acme Financial Inc.',
      phone: '+1 (555) 234-5678',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'clt_02',
      name: 'Nova Healthtech Systems',
      email: 'partners@novahealth.org',
      company: 'Nova Health Corp',
      phone: '+1 (555) 876-5432',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'clt_03',
      name: 'OmniFleet Global Logistics',
      email: 'operations@omnifleet.io',
      company: 'OmniFleet Worldwide',
      phone: '+1 (555) 345-6789',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 3. Projects: 3 Projects (Ravi owns Proj 1 & 3; Elena owns Proj 2)
  const projects = [
    {
      id: 'prj_01',
      name: 'Next-Gen Fintech Portal',
      description: 'Zero-trust multi-currency banking platform with automated compliance checks.',
      status: 'ACTIVE' as ProjectStatus,
      clientId: 'clt_01',
      managerId: 'usr_pm_01', // Ravi Sharma
      createdAt: threeDaysAgo,
      updatedAt: now,
    },
    {
      id: 'prj_02',
      name: 'Healthcare Telemedicine App',
      description: 'HIPAA-compliant video consults, prescription routing, and patient portal.',
      status: 'ACTIVE' as ProjectStatus,
      clientId: 'clt_02',
      managerId: 'usr_pm_02', // Elena Vance
      createdAt: fiveDaysAgo,
      updatedAt: now,
    },
    {
      id: 'prj_03',
      name: 'Global Fleet Tracking IoT',
      description: 'Real-time telemetry, geo-fencing, and predictive maintenance dispatch.',
      status: 'ACTIVE' as ProjectStatus,
      clientId: 'clt_03',
      managerId: 'usr_pm_01', // Ravi Sharma
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 4. Tasks: 16 Tasks across 3 projects with 2 in overdue state
  const tasks = [
    // Project 1 (Ravi)
    {
      id: 'tsk_01',
      taskNumber: 1,
      title: 'Architect JWT Authentication & Session Service',
      description: 'Implement secure access/refresh token rotation with HttpOnly cookies.',
      status: 'DONE' as TaskStatus,
      priority: 'CRITICAL' as TaskPriority,
      dueDate: threeDaysAgo,
      isOverdue: false,
      projectId: 'prj_01',
      developerId: 'usr_dev_01', // Alex
      createdAt: threeDaysAgo,
      updatedAt: now,
    },
    {
      id: 'tsk_02',
      taskNumber: 2,
      title: 'Ledger Reconciliation Microservice Pipeline',
      description: 'Process batch transactions and identify ledger discrepancies.',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      dueDate: fiveDaysAgo, // OVERDUE TASK 1
      isOverdue: true,
      projectId: 'prj_01',
      developerId: 'usr_dev_01', // Alex
      createdAt: fiveDaysAgo,
      updatedAt: now,
    },
    {
      id: 'tsk_03',
      taskNumber: 3,
      title: 'ACH Wire Transfer API Integration',
      description: 'Integrate Plaid and Stripe Treasury for real-time fund transfers.',
      status: 'IN_REVIEW' as TaskStatus,
      priority: 'CRITICAL' as TaskPriority,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: 'prj_01',
      developerId: 'usr_dev_02', // Marcus
      createdAt: twoDaysAhead,
      updatedAt: now,
    },
    {
      id: 'tsk_04',
      taskNumber: 4,
      title: 'Fraud Detection Rule Engine Setup',
      description: 'Flag anomalous transactions based on velocity thresholds.',
      status: 'TODO' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      dueDate: fiveDaysAhead,
      isOverdue: false,
      projectId: 'prj_01',
      developerId: 'usr_dev_02', // Marcus
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_05',
      taskNumber: 5,
      title: 'Customer KYC Document Verification Flow',
      description: 'ID card upload and biometric liveness verification pipeline.',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      dueDate: tenDaysAhead,
      isOverdue: false,
      projectId: 'prj_01',
      developerId: 'usr_dev_01', // Alex
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_06',
      taskNumber: 6,
      title: 'Audit Trail Export to S3 Cold Storage',
      description: 'Daily automated snapshot and GPG-encrypted archiving.',
      status: 'TODO' as TaskStatus,
      priority: 'LOW' as TaskPriority,
      dueDate: tenDaysAhead,
      isOverdue: false,
      projectId: 'prj_01',
      developerId: 'usr_dev_02', // Marcus
      createdAt: now,
      updatedAt: now,
    },

    // Project 2 (Elena)
    {
      id: 'tsk_07',
      taskNumber: 7,
      title: 'WebRTC Encrypted Video Calling Gateway',
      description: 'End-to-end encrypted peer-to-peer consult room with TURN relay.',
      status: 'IN_REVIEW' as TaskStatus,
      priority: 'CRITICAL' as TaskPriority,
      dueDate: threeDaysAgo, // OVERDUE TASK 2
      isOverdue: true,
      projectId: 'prj_02',
      developerId: 'usr_dev_03', // Priya
      createdAt: threeDaysAgo,
      updatedAt: now,
    },
    {
      id: 'tsk_08',
      taskNumber: 8,
      title: 'FHIR Medical Records Sync Engine',
      description: 'Bi-directional synchronization with hospital HL7 FHIR APIs.',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: 'prj_02',
      developerId: 'usr_dev_03', // Priya
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_09',
      taskNumber: 9,
      title: 'Prescription Digital Signature Provider',
      description: 'Cryptographic signing for e-prescriptions sent to pharmacies.',
      status: 'DONE' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      dueDate: fiveDaysAgo,
      isOverdue: false,
      projectId: 'prj_02',
      developerId: 'usr_dev_04', // David
      createdAt: fiveDaysAgo,
      updatedAt: now,
    },
    {
      id: 'tsk_10',
      taskNumber: 10,
      title: 'Patient Push Notification Dispatcher',
      description: 'Appointment reminders via APNS/FCM and SMS fallback.',
      status: 'TODO' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      dueDate: fiveDaysAhead,
      isOverdue: false,
      projectId: 'prj_02',
      developerId: 'usr_dev_04', // David
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_11',
      taskNumber: 11,
      title: 'Doctor Availability Calendar Grid',
      description: 'Slot generation with timezone compensation and double-booking guard.',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: 'prj_02',
      developerId: 'usr_dev_03', // Priya
      createdAt: now,
      updatedAt: now,
    },

    // Project 3 (Ravi)
    {
      id: 'tsk_12',
      taskNumber: 12,
      title: 'MQTT Vehicle Telemetry Ingestion Broker',
      description: 'High-throughput broker processing 50k packets/sec from OBD-II units.',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'CRITICAL' as TaskPriority,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: 'prj_03',
      developerId: 'usr_dev_01', // Alex
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_13',
      taskNumber: 13,
      title: 'Geofencing Polygon Violation Trigger',
      description: 'Spatial queries using PostGIS to detect route deviation.',
      status: 'TODO' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      dueDate: fiveDaysAhead,
      isOverdue: false,
      projectId: 'prj_03',
      developerId: 'usr_dev_04', // David
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_14',
      taskNumber: 14,
      title: 'Driver Hours-of-Service Compliance Reporter',
      description: 'DOT electronic logging device compliance calculation engine.',
      status: 'IN_REVIEW' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: 'prj_03',
      developerId: 'usr_dev_01', // Alex
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_15',
      taskNumber: 15,
      title: 'Fuel Consumption Anomaly Detection',
      description: 'Statistical anomaly detection on fuel tank level vs distance covered.',
      status: 'TODO' as TaskStatus,
      priority: 'LOW' as TaskPriority,
      dueDate: tenDaysAhead,
      isOverdue: false,
      projectId: 'prj_03',
      developerId: 'usr_dev_04', // David
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tsk_16',
      taskNumber: 16,
      title: 'Cellular SIM Provisioning and Diagnostics',
      description: 'Integration with telecom eSIM activation and roaming status API.',
      status: 'DONE' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      dueDate: threeDaysAgo,
      isOverdue: false,
      projectId: 'prj_03',
      developerId: 'usr_dev_02', // Marcus
      createdAt: threeDaysAgo,
      updatedAt: now,
    },
  ];

  // 5. Pre-existing activity log entries
  const taskActivityLogs = [
    {
      id: 'act_01',
      taskId: 'tsk_03',
      userId: 'usr_dev_02', // Marcus
      action: 'STATUS_CHANGED',
      fromStatus: 'IN_PROGRESS' as TaskStatus,
      toStatus: 'IN_REVIEW' as TaskStatus,
      description: 'Marcus Miller moved Task #3 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 8 * 60 * 1000),
    },
    {
      id: 'act_02',
      taskId: 'tsk_14',
      userId: 'usr_dev_01', // Alex
      action: 'STATUS_CHANGED',
      fromStatus: 'IN_PROGRESS' as TaskStatus,
      toStatus: 'IN_REVIEW' as TaskStatus,
      description: 'Alex Chen moved Task #14 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
    {
      id: 'act_03',
      taskId: 'tsk_02',
      userId: 'usr_admin_01',
      action: 'OVERDUE_FLAGGED',
      fromStatus: 'IN_PROGRESS' as TaskStatus,
      toStatus: 'IN_PROGRESS' as TaskStatus,
      description: 'System flagged Task #2 ("Ledger Reconciliation Microservice Pipeline") as Overdue',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
    {
      id: 'act_04',
      taskId: 'tsk_07',
      userId: 'usr_admin_01',
      action: 'OVERDUE_FLAGGED',
      fromStatus: 'IN_REVIEW' as TaskStatus,
      toStatus: 'IN_REVIEW' as TaskStatus,
      description: 'System flagged Task #7 ("WebRTC Encrypted Video Calling Gateway") as Overdue',
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
    {
      id: 'act_05',
      taskId: 'tsk_01',
      userId: 'usr_pm_01', // Ravi
      action: 'STATUS_CHANGED',
      fromStatus: 'IN_REVIEW' as TaskStatus,
      toStatus: 'DONE' as TaskStatus,
      description: 'Ravi Sharma moved Task #1 from In Review → Done',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'act_06',
      taskId: 'tsk_08',
      userId: 'usr_dev_03', // Priya
      action: 'STATUS_CHANGED',
      fromStatus: 'TODO' as TaskStatus,
      toStatus: 'IN_PROGRESS' as TaskStatus,
      description: 'Priya Patel moved Task #8 from To Do → In Progress',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'act_07',
      taskId: 'tsk_12',
      userId: 'usr_pm_01', // Ravi
      action: 'ASSIGNED',
      description: 'Ravi Sharma assigned Task #12 to Alex Chen',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'act_08',
      taskId: 'tsk_09',
      userId: 'usr_pm_02', // Elena
      action: 'STATUS_CHANGED',
      fromStatus: 'IN_REVIEW' as TaskStatus,
      toStatus: 'DONE' as TaskStatus,
      description: 'Elena Vance moved Task #9 from In Review → Done',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  ];

  // 6. Notifications
  const notifications = [
    {
      id: 'notif_01',
      userId: 'usr_pm_01', // Ravi
      title: 'Task Ready for Review',
      message: 'Marcus Miller moved Task #3 ("ACH Wire Transfer API Integration") to In Review',
      type: 'TASK_STATUS_CHANGED' as NotificationType,
      isRead: false,
      link: '/projects/prj_01?task=tsk_03',
      createdAt: new Date(now.getTime() - 8 * 60 * 1000),
    },
    {
      id: 'notif_02',
      userId: 'usr_pm_02', // Elena
      title: 'Task Overdue in Project',
      message: 'Task #7 ("WebRTC Encrypted Video Calling Gateway") in "Healthcare Telemedicine App" is overdue.',
      type: 'TASK_OVERDUE' as NotificationType,
      isRead: false,
      link: '/projects/prj_02?task=tsk_07',
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
    {
      id: 'notif_03',
      userId: 'usr_dev_01', // Alex
      title: 'Task Overdue',
      message: 'Task #2 ("Ledger Reconciliation Microservice Pipeline") is now overdue!',
      type: 'TASK_OVERDUE' as NotificationType,
      isRead: false,
      link: '/projects/prj_01?task=tsk_02',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
    {
      id: 'notif_04',
      userId: 'usr_dev_01', // Alex
      title: 'New Task Assigned',
      message: 'You were assigned Task #12 ("MQTT Vehicle Telemetry Ingestion Broker")',
      type: 'TASK_ASSIGNED' as NotificationType,
      isRead: true,
      link: '/projects/prj_03?task=tsk_12',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
  ];

  return {
    users,
    clients,
    projects,
    tasks,
    taskActivityLogs,
    notifications,
  };
};
