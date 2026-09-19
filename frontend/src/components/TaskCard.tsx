import React from 'react';
import { Calendar, AlertCircle, Clock, User as UserIcon } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onClick }) => {
  const { user } = useAuth();

  const isOverdue =
    task.isOverdue ||
    (new Date(task.dueDate).getTime() < Date.now() && task.status !== 'DONE');

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(task.id, e.target.value as TaskStatus);
  };

  return (
    <div
      onClick={onClick}
      className="card card-interactive"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Header: Priority & Task ID */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            #{task.taskNumber}
          </span>
          <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>
        </div>

        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={handleStatusSelect}
          onClick={(e) => e.stopPropagation()}
          className={`badge badge-${task.status.toLowerCase()}`}
          style={{
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Task Title & Description */}
      <div>
        <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {task.title}
        </h4>
        {task.description && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Footer: Due date & Assignee */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
        }}
      >
        {/* Due Date & Overdue Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {isOverdue ? (
            <span
              className="badge badge-overdue"
              style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.15rem 0.45rem' }}
            >
              <AlertCircle size={12} />
              Overdue
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={13} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Assigned Developer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {task.developer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} title={task.developer.name}>
              {task.developer.avatarUrl ? (
                <img
                  src={task.developer.avatarUrl}
                  alt={task.developer.name}
                  style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                />
              ) : (
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                  }}
                >
                  {task.developer.name[0]}
                </div>
              )}
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {task.developer.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.725rem' }}>
              Unassigned
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
