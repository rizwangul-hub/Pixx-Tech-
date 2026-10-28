import React from 'react';
import { Layers, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState Component
 */
export const EmptyState = ({
  icon: Icon = Layers,
  title = 'No Records Found',
  description = 'There are no active records matching your current filter criteria.',
  actionLabel,
  onAction,
  actionIcon,
}) => (
  <div
    className="glass-surface"
    style={{
      padding: '48px 24px',
      borderRadius: '20px',
      border: '1px dashed var(--border-subtle, rgba(255, 255, 255, 0.15))',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}
  >
    <div
      style={{
        width: '54px',
        height: '54px',
        borderRadius: '16px',
        backgroundColor: 'rgba(91, 140, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary-accent, #5B8CFF)',
      }}
    >
      <Icon size={26} />
    </div>
    <div style={{ maxWidth: '480px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary, #F5F7FF)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #A5B1C8)', margin: 0, lineHeight: 1.55 }}>
        {description}
      </p>
    </div>
    {actionLabel && onAction && (
      <Button variant="primary" size="sm" icon={actionIcon} onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

/**
 * ErrorState Component
 */
export const ErrorState = ({
  title = 'Service Unavailable or Error',
  message,
  onRetry,
}) => (
  <div
    className="glass-surface"
    style={{
      padding: '36px 24px',
      borderRadius: '20px',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '14px',
    }}
  >
    <AlertTriangle size={36} color="#F59E0B" />
    <div style={{ maxWidth: '520px' }}>
      <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary, #F5F7FF)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.5, margin: 0 }}>
        {message || 'An error occurred while communicating with the central portal API.'}
      </p>
    </div>
    {onRetry && (
      <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
        Retry Request
      </Button>
    )}
  </div>
);

export default EmptyState;
