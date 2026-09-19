import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  LogOut,
  Zap,
  Shield,
  Briefcase,
  Code
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <Shield size={13} style={{ color: '#a855f7' }} />;
      case 'PROJECT_MANAGER':
        return <Briefcase size={13} style={{ color: '#38bdf8' }} />;
      case 'DEVELOPER':
        return <Code size={13} style={{ color: '#34d399' }} />;
      default:
        return null;
    }
  };

  const getRoleBadgeLabel = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Admin';
      case 'PROJECT_MANAGER':
        return 'Project Manager';
      case 'DEVELOPER':
        return 'Developer';
      default:
        return user?.role;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Zap size={18} />
        </div>
        <div>
          <h1 className="sidebar-title" style={{ fontSize: '1.05rem', margin: 0 }}>VELOZITY</h1>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Global Solutions
          </p>
        </div>
      </div>

      <div style={{ padding: '1rem 1.25rem 0.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.65rem',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}>
          {getRoleIcon()}
          <span>{getRoleBadgeLabel()}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FolderKanban size={18} />
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={18} />
          <span>Tasks & Board</span>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Activity size={18} />
          <span>Live Activity Feed</span>
        </NavLink>
      </nav>

      {/* User Info & Logout at bottom */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {user?.name?.[0] || 'U'}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0
            }}>
              {user?.name}
            </p>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0
            }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="btn-icon"
          style={{ padding: '0.4rem', color: '#f87171' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
