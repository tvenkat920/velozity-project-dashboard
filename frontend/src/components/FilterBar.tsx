import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Calendar } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';

export const FilterBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || 'ALL';
  const priority = searchParams.get('priority') || 'ALL';
  const isOverdue = searchParams.get('isOverdue') || '';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    // preserve project if exists
    const proj = searchParams.get('projectId');
    if (proj) next.set('projectId', proj);
    setSearchParams(next);
  };

  const hasActiveFilters =
    status !== 'ALL' || priority !== 'ALL' || isOverdue !== '' || dueDateFrom !== '' || dueDateTo !== '';

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '0.9rem 1.1rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
        <Filter size={15} />
        <span>Filters:</span>
      </div>

      {/* Status Filter */}
      <div style={{ minWidth: '130px' }}>
        <select
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="form-select"
          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div style={{ minWidth: '130px' }}>
        <select
          value={priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          className="form-select"
          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Overdue Switch / Filter */}
      <div style={{ minWidth: '120px' }}>
        <select
          value={isOverdue}
          onChange={(e) => updateFilter('isOverdue', e.target.value)}
          className="form-select"
          style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
        >
          <option value="">All Deadlines</option>
          <option value="true">Overdue Only</option>
          <option value="false">On Schedule</option>
        </select>
      </div>

      {/* Date Range: From */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
        <input
          type="date"
          value={dueDateFrom}
          onChange={(e) => updateFilter('dueDateFrom', e.target.value)}
          className="form-input"
          style={{ padding: '0.35rem 0.55rem', fontSize: '0.775rem', width: '130px' }}
        />
      </div>

      {/* Date Range: To */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
        <input
          type="date"
          value={dueDateTo}
          onChange={(e) => updateFilter('dueDateTo', e.target.value)}
          className="form-input"
          style={{ padding: '0.35rem 0.55rem', fontSize: '0.775rem', width: '130px' }}
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="btn btn-outline btn-sm"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f87171' }}
        >
          <X size={14} />
          Reset Filters
        </button>
      )}
    </div>
  );
};
