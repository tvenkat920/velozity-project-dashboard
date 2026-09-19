import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Client, User as UserType } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<UserType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Client quick-add toggle
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setIsCreatingClient(false);

      // Load clients
      apiClient<Client[]>('/clients')
        .then((data) => {
          setClients(data);
          if (data.length > 0) setClientId(data[0].id);
        })
        .catch((err) => console.error(err));

      // If Admin, load project managers
      if (user?.role === 'ADMIN') {
        apiClient<UserType[]>('/users?role=PROJECT_MANAGER')
          .then((data) => {
            setManagers(data);
            if (data.length > 0) setManagerId(data[0].id);
          })
          .catch((err) => console.error(err));
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleQuickClientCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientCompany) {
      setError('Please fill in all client fields');
      return;
    }
    try {
      const newClient = await apiClient<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          company: clientCompany,
        }),
      });
      setClients((prev) => [...prev, newClient]);
      setClientId(newClient.id);
      setIsCreatingClient(false);
      setClientName('');
      setClientEmail('');
      setClientCompany('');
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiClient('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          clientId,
          ...(user?.role === 'ADMIN' && managerId && { managerId }),
        }),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Create New Project</h3>
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

            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Next-Gen Banking API"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project objectives and high-level milestones..."
                className="form-textarea"
              />
            </div>

            {/* Client selection or quick create */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <label className="form-label">Client *</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingClient(!isCreatingClient)}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  {isCreatingClient ? 'Select Existing Client' : '+ New Client'}
                </button>
              </div>

              {isCreatingClient ? (
                <div
                  style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="email"
                    placeholder="Contact Email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={handleQuickClientCreate}
                    className="btn btn-secondary btn-sm"
                  >
                    Save & Select Client
                  </button>
                </div>
              ) : (
                <select
                  value={clientId}
                  required
                  onChange={(e) => setClientId(e.target.value)}
                  className="form-select"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Admin can assign to specific Project Manager */}
            {user?.role === 'ADMIN' && (
              <div className="form-group">
                <label className="form-label">Assign Project Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="form-select"
                >
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={saving || !clientId} className="btn btn-primary">
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
