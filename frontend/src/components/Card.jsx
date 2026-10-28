import React from 'react';

/**
 * Reusable Glassmorphism Card Component
 * Supports dark/light themes and 3D elevation
 */
const Card = ({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  style = {},
  elevated = false,
  is3d = false,
  ...props
}) => {
  return (
    <div
      className={`glass-surface ${is3d ? 'card-3d-tilt' : ''} ${className}`}
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: elevated
          ? 'var(--bg-glass-elevated, rgba(22, 36, 66, 0.85))'
          : 'var(--bg-glass, rgba(17, 27, 48, 0.75))',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        borderRadius: 'var(--radius-lg, 20px)',
        color: 'var(--text-primary, #F5F7FF)',
        ...style,
      }}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '18px',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {Icon && (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(53, 214, 255, 0.1)',
                  border: '1px solid rgba(53, 214, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cyan-accent, #35D6FF)',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
            )}
            <div>
              {title && (
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary, #F5F7FF)', margin: 0 }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary, #A5B1C8)', marginTop: '2px', margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
};

export default Card;
