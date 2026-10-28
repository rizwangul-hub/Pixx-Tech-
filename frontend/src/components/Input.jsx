import React from 'react';

/**
 * Reusable Form Input Component
 * Theme-aware and accessible
 */
const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  helperText,
  disabled = false,
  className = '',
  style = {},
  required = false,
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', ...style }} className={className}>
      {label && (
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-secondary, #A5B1C8)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{label}</span>
          {required && <span style={{ color: '#f43f5e' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '14px',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icon size={17} />
          </div>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            height: '42px',
            padding: Icon ? '0 16px 0 42px' : '0 16px',
            background: 'var(--bg-base, rgba(10, 15, 34, 0.75))',
            border: `1px solid ${error ? '#f43f5e' : 'var(--border-subtle, rgba(255, 255, 255, 0.1))'}`,
            borderRadius: '10px',
            color: 'var(--text-primary, #f8fafc)',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = 'var(--cyan-accent, #35D6FF)';
              e.target.style.boxShadow = '0 0 0 3px rgba(53, 214, 255, 0.18)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = 'var(--border-subtle)';
              e.target.style.boxShadow = 'none';
            }
          }}
          {...props}
        />
      </div>

      {error ? (
        <span style={{ fontSize: '12px', color: '#fb7185' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
