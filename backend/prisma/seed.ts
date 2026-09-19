import { PrismaClient, Role, TaskStatus, TaskPriority, ProjectStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  // 1 Admin, 2 Project Managers, 4 Developers
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Admin',
      email: 'admin@velozity.com',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      name: 'Ravi Sharma',
      email: 'ravi.pm@velozity.com',
      passwordHash: hashedPassword,
      role: Role.PROJECT_MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: 'Elena Vance',
      email: 'elena.pm@velozity.com',
      passwordHash: hashedPassword,
      role: Role.PROJECT_MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex.dev@velozity.com',
      passwordHash: hashedPassword,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      name: 'Marcus Miller',
      email: 'marcus.dev@velozity.com',
      passwordHash: hashedPassword,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.dev@velozity.com',
      passwordHash: hashedPassword,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'david.dev@velozity.com',
      passwordHash: hashedPassword,
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    },
  });

  console.log('👤 Created 1 Admin, 2 PMs, 4 Developers.');

  // 2. Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Financial Group',
      email: 'contact@acmefinancial.com',
      company: 'Acme Financial Inc.',
      phone: '+1 (555) 234-5678',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Nova Healthtech Systems',
      email: 'partners@novahealth.org',
      company: 'Nova Health Corp',
      phone: '+1 (555) 876-5432',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'OmniFleet Global Logistics',
      email: 'operations@omnifleet.io',
      company: 'OmniFleet Worldwide',
      phone: '+1 (555) 345-6789',
    },
  });

  console.log('🏢 Created 3 Clients.');

  // 3. Create Projects
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const twoDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fiveDaysAhead = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const tenDaysAhead = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const project1 = await prisma.project.create({
    data: {
      name: 'Next-Gen Fintech Portal',
      description: 'Zero-trust multi-currency banking platform with automated compliance checks.',
      status: ProjectStatus.ACTIVE,
      clientId: client1.id,
      managerId: pm1.id, // Ravi Sharma
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Healthcare Telemedicine App',
      description: 'HIPAA-compliant video consults, prescription routing, and patient portal.',
      status: ProjectStatus.ACTIVE,
      clientId: client2.id,
      managerId: pm2.id, // Elena Vance
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Global Fleet Tracking IoT',
      description: 'Real-time telemetry, geo-fencing, and predictive maintenance dispatch.',
      status: ProjectStatus.ACTIVE,
      clientId: client3.id,
      managerId: pm1.id, // Ravi Sharma
    },
  });

  console.log('📁 Created 3 Projects.');

  // 4. Create Tasks
  // Project 1 Tasks (Managed by Ravi, PM1)
  const task1 = await prisma.task.create({
    data: {
      title: 'Architect JWT Authentication & Session Service',
      description: 'Implement secure access/refresh token rotation with HttpOnly cookies.',
      status: TaskStatus.DONE,
      priority: TaskPriority.CRITICAL,
      dueDate: threeDaysAgo,
      isOverdue: false,
      projectId: project1.id,
      developerId: dev1.id, // Alex Chen
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Ledger Reconciliation Microservice Pipeline',
      description: 'Process batch transactions and identify ledger discrepancies.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: fiveDaysAgo, // OVERDUE TASK 1
      isOverdue: true,
      projectId: project1.id,
      developerId: dev1.id, // Alex Chen
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'ACH Wire Transfer API Integration',
      description: 'Integrate Plaid and Stripe Treasury for real-time fund transfers.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: project1.id,
      developerId: dev2.id, // Marcus Miller
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Fraud Detection Rule Engine Setup',
      description: 'Flag anomalous transactions based on velocity thresholds.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: fiveDaysAhead,
      isOverdue: false,
      projectId: project1.id,
      developerId: dev2.id, // Marcus Miller
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Customer KYC Document Verification Flow',
      description: 'ID card upload and biometric liveness verification pipeline.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: tenDaysAhead,
      isOverdue: false,
      projectId: project1.id,
      developerId: dev1.id, // Alex Chen
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Audit Trail Export to S3 Cold Storage',
      description: 'Daily automated snapshot and GPG-encrypted archiving.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: tenDaysAhead,
      isOverdue: false,
      projectId: project1.id,
      developerId: dev2.id, // Marcus Miller
    },
  });

  // Project 2 Tasks (Managed by Elena, PM2)
  const task7 = await prisma.task.create({
    data: {
      title: 'WebRTC Encrypted Video Calling Gateway',
      description: 'End-to-end encrypted peer-to-peer consult room with TURN relay.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: threeDaysAgo, // OVERDUE TASK 2
      isOverdue: true,
      projectId: project2.id,
      developerId: dev3.id, // Priya Patel
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: 'FHIR Medical Records Sync Engine',
      description: 'Bi-directional synchronization with hospital HL7 FHIR APIs.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: project2.id,
      developerId: dev3.id, // Priya Patel
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: 'Prescription Digital Signature Provider',
      description: 'Cryptographic signing for e-prescriptions sent to pharmacies.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: fiveDaysAgo,
      isOverdue: false,
      projectId: project2.id,
      developerId: dev4.id, // David Kim
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: 'Patient Push Notification Dispatcher',
      description: 'Appointment reminders via APNS/FCM and SMS fallback.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: fiveDaysAhead,
      isOverdue: false,
      projectId: project2.id,
      developerId: dev4.id, // David Kim
    },
  });

  const task11 = await prisma.task.create({
    data: {
      title: 'Doctor Availability Calendar Grid',
      description: 'Slot generation with timezone compensation and double-booking guard.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: project2.id,
      developerId: dev3.id, // Priya Patel
    },
  });

  // Project 3 Tasks (Managed by Ravi, PM1)
  const task12 = await prisma.task.create({
    data: {
      title: 'MQTT Vehicle Telemetry Ingestion Broker',
      description: 'High-throughput broker processing 50k packets/sec from OBD-II units.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: project3.id,
      developerId: dev1.id, // Alex Chen
    },
  });

  const task13 = await prisma.task.create({
    data: {
      title: 'Geofencing Polygon Violation Trigger',
      description: 'Spatial queries using PostGIS to detect route deviation.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: fiveDaysAhead,
      isOverdue: false,
      projectId: project3.id,
      developerId: dev4.id, // David Kim
    },
  });

  const task14 = await prisma.task.create({
    data: {
      title: 'Driver Hours-of-Service Compliance Reporter',
      description: 'DOT electronic logging device compliance calculation engine.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: twoDaysAhead,
      isOverdue: false,
      projectId: project3.id,
      developerId: dev1.id, // Alex Chen
    },
  });

  const task15 = await prisma.task.create({
    data: {
      title: 'Fuel Consumption Anomaly Detection',
      description: 'Statistical anomaly detection on fuel tank level vs distance covered.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: tenDaysAhead,
      isOverdue: false,
      projectId: project3.id,
      developerId: dev4.id, // David Kim
    },
  });

  const task16 = await prisma.task.create({
    data: {
      title: 'Cellular SIM Provisioning and Diagnostics',
      description: 'Integration with telecom eSIM activation and roaming status API.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: threeDaysAgo,
      isOverdue: false,
      projectId: project3.id,
      developerId: dev2.id, // Marcus Miller
    },
  });

  console.log('📋 Created 16 Tasks across 3 Projects (including 2 Overdue tasks).');

  // 5. Create Pre-existing Activity Log Entries
  // Requirements:
  // "Pre-existing activity log entries so the feed is not empty on first load"
  // "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
  const activities = [
    {
      taskId: task3.id,
      userId: dev2.id, // Marcus Miller
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      description: 'Marcus Miller moved Task #3 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 8 * 60 * 1000), // 8 mins ago
    },
    {
      taskId: task14.id,
      userId: dev1.id, // Alex Chen
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      description: 'Alex Chen moved Task #14 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 25 * 60 * 1000), // 25 mins ago
    },
    {
      taskId: task2.id,
      userId: admin.id,
      action: 'OVERDUE_FLAGGED',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_PROGRESS,
      description: 'System flagged Task #2 ("Ledger Reconciliation Microservice Pipeline") as Overdue',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
    },
    {
      taskId: task7.id,
      userId: admin.id,
      action: 'OVERDUE_FLAGGED',
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.IN_REVIEW,
      description: 'System flagged Task #7 ("WebRTC Encrypted Video Calling Gateway") as Overdue',
      createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
    },
    {
      taskId: task1.id,
      userId: pm1.id, // Ravi Sharma
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      description: 'Ravi Sharma moved Task #1 from In Review → Done',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      taskId: task8.id,
      userId: dev3.id, // Priya Patel
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      description: 'Priya Patel moved Task #8 from To Do → In Progress',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      taskId: task12.id,
      userId: pm1.id, // Ravi Sharma
      action: 'ASSIGNED',
      description: 'Ravi Sharma assigned Task #12 to Alex Chen',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      taskId: task9.id,
      userId: pm2.id, // Elena Vance
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      description: 'Elena Vance moved Task #9 from In Review → Done',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      taskId: task16.id,
      userId: pm1.id, // Ravi Sharma
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      description: 'Ravi Sharma moved Task #16 from In Review → Done',
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      taskId: task5.id,
      userId: dev1.id, // Alex Chen
      action: 'STATUS_CHANGED',
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      description: 'Alex Chen moved Task #5 from To Do → In Progress',
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
  ];

  for (const act of activities) {
    await prisma.taskActivityLog.create({ data: act });
  }

  console.log(`📜 Seeded ${activities.length} activity log entries.`);

  // 6. Create Initial Notifications
  // Notify PM1 that Task 3 is in review
  await prisma.notification.create({
    data: {
      userId: pm1.id,
      title: 'Task Ready for Review',
      message: 'Marcus Miller moved Task #3 ("ACH Wire Transfer API Integration") to In Review',
      type: NotificationType.TASK_STATUS_CHANGED,
      link: `/projects/${project1.id}?task=${task3.id}`,
      isRead: false,
      createdAt: new Date(now.getTime() - 8 * 60 * 1000),
    },
  });

  // Notify PM2 that Task 7 is in review and overdue
  await prisma.notification.create({
    data: {
      userId: pm2.id,
      title: 'Task Overdue in Project',
      message: 'Task #7 ("WebRTC Encrypted Video Calling Gateway") in "Healthcare Telemedicine App" is overdue.',
      type: NotificationType.TASK_OVERDUE,
      link: `/projects/${project2.id}?task=${task7.id}`,
      isRead: false,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
  });

  // Notify Dev1 about overdue task
  await prisma.notification.create({
    data: {
      userId: dev1.id,
      title: 'Task Overdue',
      message: 'Task #2 ("Ledger Reconciliation Microservice Pipeline") is now overdue!',
      type: NotificationType.TASK_OVERDUE,
      link: `/projects/${project1.id}?task=${task2.id}`,
      isRead: false,
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
  });

  // Notify Dev1 about task assignment
  await prisma.notification.create({
    data: {
      userId: dev1.id,
      title: 'New Task Assigned',
      message: 'You were assigned Task #12 ("MQTT Vehicle Telemetry Ingestion Broker")',
      type: NotificationType.TASK_ASSIGNED,
      link: `/projects/${project3.id}?task=${task12.id}`,
      isRead: true,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
  });

  console.log('🔔 Seeded notifications.');
  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Credentials for quick testing:');
  console.log('Admin:       admin@velozity.com    / Password123!');
  console.log('PM (Ravi):   ravi.pm@velozity.com  / Password123!');
  console.log('PM (Elena):  elena.pm@velozity.com / Password123!');
  console.log('Dev (Alex):  alex.dev@velozity.com / Password123!');
  console.log('Dev (Marcus):marcus.dev@velozity.com / Password123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
