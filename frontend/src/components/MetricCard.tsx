import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          iconBg: 'rgba(56, 189, 248, 0.15)',
          iconColor: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
        };
      case 'warning':
        return {
          iconBg: 'rgba(245, 158, 11, 0.15)',
          iconColor: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case 'danger':
        return {
          iconBg: 'rgba(239, 68, 68, 0.15)',
          iconColor: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case 'success':
        return {
          iconBg: 'rgba(16, 185, 129, 0.15)',
          iconColor: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
        };
      default:
        return {
          iconBg: 'var(--bg-surface-elevated)',
          iconColor: 'var(--text-secondary)',
          border: 'var(--border-subtle)',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.85rem',
        borderLeft: `3px solid ${styles.iconColor}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: styles.iconBg,
            color: styles.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          {value}
        </div>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
