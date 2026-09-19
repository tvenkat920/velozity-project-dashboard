import React from 'react';
import { Activity, Radio } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ActivityFeed } from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();

  const getFeedScopeDescription = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Global Organization Feed — Streaming live updates across all clients and projects.';
      case 'PROJECT_MANAGER':
        return 'Managed Projects Feed — Streaming real-time updates for projects you created.';
      case 'DEVELOPER':
        return 'Personal Assignment Feed — Streaming live updates for tasks assigned to you.';
      default:
        return 'Real-time activity stream.';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Navbar title="Live Activity Stream" subtitle="WebSocket-driven role-filtered feed" />

      <div className="page-body">
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Live Activity Feed</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.55rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              <Radio size={12} />
              LIVE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {getFeedScopeDescription()}
          </p>
        </div>

        <div style={{ maxWidth: '850px', height: '700px' }}>
          <ActivityFeed showHeader={false} limit={30} />
        </div>
      </div>
    </div>
  );
};
