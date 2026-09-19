import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckSquare, Plus, Kanban, List, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navbar } from '../components/Navbar';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { FilterBar } from '../components/FilterBar';

export const TasksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      // Pass all query parameters to the backend
      const queryStr = searchParams.toString();
      const endpoint = queryStr ? `/tasks?${queryStr}` : '/tasks';
      const data = await apiClient<Task[]>(endpoint);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchParams]);

  // Real-time task status updates via WebSocket
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
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const columns: { title: string; status: TaskStatus; color: string }[] = [
    { title: 'To Do', status: 'TODO', color: '#94a3b8' },
    { title: 'In Progress', status: 'IN_PROGRESS', color: '#38bdf8' },
    { title: 'In Review', status: 'IN_REVIEW', color: '#f59e0b' },
    { title: 'Done', status: 'DONE', color: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Navbar title="Tasks & Sprint Board" subtitle="Role-filtered workflow management" />

      <div className="page-body">
        {/* Header & Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Tasks Management</h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {user?.role === 'DEVELOPER'
                ? 'Tasks assigned exclusively to you'
                : user?.role === 'PROJECT_MANAGER'
                ? 'Tasks in projects you manage'
                : 'All enterprise system tasks'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '0.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                onClick={() => setViewMode('board')}
                className="btn-icon"
                style={{
                  padding: '0.35rem 0.6rem',
                  backgroundColor: viewMode === 'board' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'board' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                title="Board View"
              >
                <Kanban size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="btn-icon"
                style={{
                  padding: '0.35rem 0.6rem',
                  backgroundColor: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Shareable Filter Bar */}
        <FilterBar />

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading tasks...
          </div>
        ) : viewMode === 'board' ? (
          /* Kanban Board View */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start',
              overflowX: 'auto',
              paddingBottom: '1rem',
            }}
          >
            {columns.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1rem',
                    minHeight: '480px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '0.75rem',
                      marginBottom: '0.85rem',
                      borderBottom: `2px solid ${col.color}`,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{col.title}</span>
                    <span
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {columnTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {columnTasks.length === 0 ? (
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.775rem',
                          fontStyle: 'italic',
                        }}
                      >
                        No tasks in this stage
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsModalOpen(true);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tasks match current filter criteria
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSaved={fetchTasks}
      />
    </div>
  );
};
