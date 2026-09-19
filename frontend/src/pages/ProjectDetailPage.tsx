import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Plus,
  Building,
  User,
  Calendar,
  Layers,
  Activity,
} from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskModal } from '../components/TaskModal';
import { FilterBar } from '../components/FilterBar';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { joinProject, leaveProject, socket } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Join the project's WebSocket room on mount and leave on unmount
  useEffect(() => {
    if (id) {
      joinProject(id);
    }
    return () => {
      if (id) {
        leaveProject(id);
      }
    };
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      const proj = await apiClient<Project>(`/projects/${id}`);
      setProject(proj);
      setTasks(proj.tasks || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Real-time task update listener in project room
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (data: { taskId: string; status: TaskStatus }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === data.taskId ? { ...t, status: data.status } : t))
      );
    };

    socket.on('task:statusUpdated', handleTaskUpdated);

    return () => {
      socket.off('task:statusUpdated', handleTaskUpdated);
    };
  }, [socket]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiClient(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Filter tasks based on URL parameters
  const filteredTasks = tasks.filter((task) => {
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');
    const overdueFilter = searchParams.get('isOverdue');
    const fromFilter = searchParams.get('dueDateFrom');
    const toFilter = searchParams.get('dueDateTo');

    if (statusFilter && statusFilter !== 'ALL' && task.status !== statusFilter) {
      return false;
    }
    if (priorityFilter && priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
      return false;
    }
    if (overdueFilter === 'true' && !task.isOverdue) {
      return false;
    }
    if (overdueFilter === 'false' && task.isOverdue) {
      return false;
    }
    if (fromFilter && new Date(task.dueDate) < new Date(fromFilter)) {
      return false;
    }
    if (toFilter && new Date(task.dueDate) > new Date(toFilter)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Navbar title="Loading project..." />
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading project data...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Navbar title="Project Not Found" />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h3>Project not found or access denied.</h3>
          <Link to="/projects" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Navbar title={project.name} subtitle={`Client: ${project.client?.company}`} />

      <div className="page-body">
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{project.name}</h1>
                <span className="badge badge-in_progress">{project.status}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '700px' }}>
                {project.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building size={14} style={{ color: 'var(--accent-primary)' }} />
                  {project.client?.company} ({project.client?.name})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={14} />
                  Manager: {project.manager?.name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Layers size={14} />
                  {tasks.length} total tasks
                </span>
              </div>
            </div>

            {user?.role !== 'DEVELOPER' && (
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <FilterBar />

        {/* Main Content: Tasks Grid + Project-Specific Real-Time Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Project Tasks ({filteredTasks.length})
              </h3>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No tasks match current filters
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onStatusChange={handleStatusChange}
                    onClick={() => {
                      setSelectedTask(t);
                      setIsTaskModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Project-Specific Live Activity Feed */}
          <div style={{ height: '620px' }}>
            <ActivityFeed projectId={project.id} showHeader={true} limit={20} />
          </div>
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        projectId={project.id}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSaved={fetchProjectData}
      />
    </div>
  );
};
