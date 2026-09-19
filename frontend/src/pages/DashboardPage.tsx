import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Flame,
  Plus,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../api/client';
import { DashboardMetrics, Task, TaskStatus } from '../types';
import { Navbar } from '../components/Navbar';
import { MetricCard } from '../components/MetricCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskCard } from '../components/TaskCard';
import { ProjectModal } from '../components/ProjectModal';
import { TaskModal } from '../components/TaskModal';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { onlineCount } = useSocket();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await apiClient<DashboardMetrics>('/dashboard/metrics');
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiClient(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMetrics();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Navbar
        title="Command Center"
        subtitle={`Welcome back, ${user?.name} · Role: ${user?.role}`}
      />

      <div className="page-body">
        {/* Action Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              {user?.role === 'ADMIN'
                ? 'System Executive Overview'
                : user?.role === 'PROJECT_MANAGER'
                ? 'Portfolio Management'
                : 'My Development Sprint'}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Real-time analytics and live team operations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {user?.role !== 'DEVELOPER' && (
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="btn btn-secondary"
              >
                <Plus size={16} />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. ADMIN DASHBOARD VIEW */}
        {user?.role === 'ADMIN' && metrics && (
          <div>
            {/* KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <MetricCard
                title="Total Projects"
                value={(metrics as any).totalProjects}
                subtitle="Active enterprise clients"
                icon={<FolderKanban size={20} />}
                variant="primary"
              />
              <MetricCard
                title="Total Tasks"
                value={(metrics as any).totalTasks}
                subtitle={`${(metrics as any).tasksByStatus?.DONE || 0} completed`}
                icon={<CheckCircle2 size={20} />}
                variant="default"
              />
              <MetricCard
                title="Overdue Tasks"
                value={(metrics as any).overdueTaskCount}
                subtitle="Requires attention"
                icon={<AlertTriangle size={20} />}
                variant="danger"
              />
              <MetricCard
                title="Online Right Now"
                value={onlineCount}
                subtitle="Live WebSocket presence"
                icon={<Users size={20} />}
                variant="success"
              />
            </div>

            {/* Main Admin Section: Status Breakdown & Global Live Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Task Breakdown by Status */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Task Breakdown by Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { label: 'To Do', count: (metrics as any).tasksByStatus?.TODO || 0, color: '#94a3b8' },
                    { label: 'In Progress', count: (metrics as any).tasksByStatus?.IN_PROGRESS || 0, color: '#38bdf8' },
                    { label: 'In Review', count: (metrics as any).tasksByStatus?.IN_REVIEW || 0, color: '#f59e0b' },
                    { label: 'Done', count: (metrics as any).tasksByStatus?.DONE || 0, color: '#10b981' },
                  ].map((item) => {
                    const total = (metrics as any).totalTasks || 1;
                    const pct = Math.round((item.count / total) * 100);
                    return (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>{item.label}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              backgroundColor: item.color,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Link
                    to="/tasks"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <span>View all tasks board</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Global Activity Feed */}
              <div style={{ height: '420px' }}>
                <ActivityFeed showHeader={true} limit={20} />
              </div>
            </div>
          </div>
        )}

        {/* 2. PROJECT MANAGER DASHBOARD VIEW */}
        {user?.role === 'PROJECT_MANAGER' && metrics && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <MetricCard
                title="My Projects"
                value={(metrics as any).projectsSummary?.total || 0}
                subtitle={`${(metrics as any).projectsSummary?.active || 0} actively running`}
                icon={<FolderKanban size={20} />}
                variant="primary"
              />
              <MetricCard
                title="Critical Priority"
                value={(metrics as any).tasksByPriority?.CRITICAL || 0}
                subtitle="Immediate delivery"
                icon={<Flame size={20} />}
                variant="danger"
              />
              <MetricCard
                title="High Priority"
                value={(metrics as any).tasksByPriority?.HIGH || 0}
                subtitle="Sprint core deliverables"
                icon={<AlertTriangle size={20} />}
                variant="warning"
              />
              <MetricCard
                title="Overdue Tasks"
                value={(metrics as any).overdueTaskCount || 0}
                subtitle="Tasks past due date"
                icon={<Clock size={20} />}
                variant="danger"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
              {/* Upcoming Due Dates This Week */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    Upcoming Deadlines This Week
                  </h3>
                  <Link to="/tasks" style={{ fontSize: '0.775rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    View All
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {((metrics as any).upcomingDueDatesThisWeek || []).length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0' }}>
                      No tasks due this week.
                    </p>
                  ) : (
                    ((metrics as any).upcomingDueDatesThisWeek || []).map((t: Task) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem 0.9rem',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                            {t.title}
                          </p>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {t.project?.name} · Assigned to {t.developer?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PM Project Activity Feed */}
              <div style={{ height: '420px' }}>
                <ActivityFeed showHeader={true} limit={20} />
              </div>
            </div>
          </div>
        )}

        {/* 3. DEVELOPER DASHBOARD VIEW */}
        {user?.role === 'DEVELOPER' && metrics && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <MetricCard
                title="Assigned to Me"
                value={(metrics as any).totalAssigned || 0}
                subtitle="All active tasks"
                icon={<CheckCircle2 size={20} />}
                variant="primary"
              />
              <MetricCard
                title="In Progress"
                value={(metrics as any).tasksByStatus?.IN_PROGRESS || 0}
                subtitle="Currently coding"
                icon={<TrendingUp size={20} />}
                variant="warning"
              />
              <MetricCard
                title="In Review"
                value={(metrics as any).tasksByStatus?.IN_REVIEW || 0}
                subtitle="Awaiting PM review"
                icon={<Clock size={20} />}
                variant="default"
              />
              <MetricCard
                title="Overdue Tasks"
                value={(metrics as any).overdueCount || 0}
                subtitle="Requires quick action"
                icon={<AlertTriangle size={20} />}
                variant="danger"
              />
            </div>

            {/* Developer Task List: Sorted by Priority then Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                    My Assigned Tasks (Priority & Due Date)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Click status to update in real time
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {((metrics as any).assignedTasks || []).length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No tasks currently assigned to you!
                    </div>
                  ) : (
                    ((metrics as any).assignedTasks || []).map((task: Task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleTaskStatusChange}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsTaskModalOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Developer Real-time Activity Feed */}
              <div style={{ height: '560px' }}>
                <ActivityFeed showHeader={true} limit={20} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreated={fetchMetrics}
      />

      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSaved={fetchMetrics}
      />
    </div>
  );
};
