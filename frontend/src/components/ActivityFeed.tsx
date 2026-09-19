import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, ExternalLink } from 'lucide-react';
import { ActivityItem } from '../types';
import { apiClient } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

interface ActivityFeedProps {
  projectId?: string;
  limit?: number;
  showHeader?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  limit = 20,
  showHeader = true,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityId, setNewActivityId] = useState<string | null>(null);
  const { socket } = useSocket();

  // 1. Fetch missed / recent 20 activities directly from DB
  const loadActivities = async () => {
    try {
      const endpoint = projectId
        ? `/activity?limit=${limit}&projectId=${projectId}`
        : `/activity?limit=${limit}`;
      const data = await apiClient<ActivityItem[]>(endpoint);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  // 2. Real-time WebSocket listener
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity: ActivityItem) => {
      // If we are filtering by project, verify it matches
      if (projectId && activity.projectId !== projectId) {
        return;
      }

      setActivities((prev) => {
        // Avoid duplicate
        if (prev.some((a) => a.id === activity.id)) return prev;
        return [activity, ...prev.slice(0, 49)];
      });

      // Highlight new item
      setNewActivityId(activity.id);
      setTimeout(() => setNewActivityId(null), 3000);
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket, projectId]);

  const formatTimeAgo = (dateStr: string | Date) => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {showHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.85rem',
            marginBottom: '0.85rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={16} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Live Activity Feed</h3>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Real-time WebSocket
          </span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading live activity...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recent activity recorded
          </div>
        ) : (
          activities.map((item) => {
            const isFresh = item.id === newActivityId;
            return (
              <div
                key={item.id}
                className="activity-item"
                style={{
                  backgroundColor: isFresh ? 'rgba(56, 189, 248, 0.15)' : undefined,
                  borderLeft: isFresh ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  transition: 'all 0.4s ease',
                }}
              >
                {/* User Avatar */}
                {item.userAvatar ? (
                  <img
                    src={item.userAvatar}
                    alt={item.userName}
                    className="activity-avatar"
                  />
                ) : (
                  <div className="activity-avatar">
                    {item.userName?.[0] || 'U'}
                  </div>
                )}

                <div className="activity-content">
                  {/* Exactly required format:
                      "Ravi moved Task #12 from In Progress → In Review · 2 mins ago" */}
                  <p className="activity-desc">
                    {item.description}{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      · {formatTimeAgo(item.createdAt)}
                    </span>
                  </p>

                  <div className="activity-meta">
                    {item.projectName && (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                        {item.projectName}
                      </span>
                    )}
                    {item.taskTitle && (
                      <>
                        <span>•</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.taskTitle}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
