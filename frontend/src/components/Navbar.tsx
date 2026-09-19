import React from 'react';
import { Radio, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle }) => {
  const { isConnected, onlineCount } = useSocket();
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
          {title || 'Dashboard'}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Live WebSocket Presence & Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
              }}
            />
            <span style={{ color: isConnected ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
              {isConnected ? 'LIVE' : 'CONNECTING'}
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
            <Users size={13} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{onlineCount}</span>
            <span>online</span>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--border-subtle)' }}
            />
          ) : (
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {user?.name?.[0]}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
