import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Clock, Check, User } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, User as UserType } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface TaskModalProps {
  task?: Task | null;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  projectId,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const isEditing = !!task;
  const isDeveloper = user?.role === 'DEVELOPER';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [developerId, setDeveloperId] = useState<string>('');
  const [developers, setDevelopers] = useState<UserType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setDeveloperId(task.developerId || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      // Default due date to 5 days in the future
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setDueDate(d.toISOString().split('T')[0]);
      setDeveloperId('');
    }
    setError(null);
  }, [task, isOpen]);

  // Load available developers for assignment
  useEffect(() => {
    if (isOpen && user?.role !== 'DEVELOPER') {
      apiClient<UserType[]>('/users?role=DEVELOPER')
        .then((data) => setDevelopers(data))
        .catch((err) => console.error('Error fetching developers:', err));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isDeveloper && task) {
        // Developer can ONLY update status
        await apiClient(`/tasks/${task.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      } else if (isEditing && task) {
        // PM or Admin full edit
        await apiClient(`/tasks/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title,
            description,
            status,
            priority,
            dueDate: new Date(dueDate).toISOString(),
            developerId: developerId || null,
          }),
        });
      } else {
        // Create new task
        await apiClient('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title,
            description,
            projectId,
            status,
            priority,
            dueDate: new Date(dueDate).toISOString(),
            developerId: developerId || null,
          }),
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            {isDeveloper
              ? `Update Task Status #${task?.taskNumber}`
              : isEditing
              ? `Edit Task #${task?.taskNumber}`
              : 'Create New Task'}
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.825rem',
                  marginBottom: '1rem',
                }}
              >
                {error}
              </div>
            )}

            {/* If developer, show read-only details and editable status */}
            {isDeveloper ? (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {task?.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {task?.description || 'No description provided'}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="form-select"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review (Notifies PM)</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Implement OAuth Authentication"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed specifications, deliverables, or acceptance criteria..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="form-select"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="form-select"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign Developer</label>
                    <select
                      value={developerId}
                      onChange={(e) => setDeveloperId(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Unassigned</option>
                      {developers.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name} ({dev.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
