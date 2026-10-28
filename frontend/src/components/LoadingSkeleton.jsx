import React from 'react';

/**
 * Shimmering Loading Skeleton Components
 * Used for cards, tables, and metric blocks during API queries
 */
export const CardSkeleton = () => (
  <div
    style={{
      padding: '24px 22px',
      borderRadius: '20px',
      backgroundColor: 'var(--bg-glass, rgba(17, 27, 48, 0.78))',
      border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '240px',
    }}
  >
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '14px' }} />
        <div className="skeleton-shimmer" style={{ width: '80px', height: '22px', borderRadius: '999px' }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: '70%', height: '20px', marginBottom: '10px' }} />
      <div className="skeleton-shimmer" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
      <div className="skeleton-shimmer" style={{ width: '85%', height: '14px' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="skeleton-shimmer" style={{ width: '60px', height: '14px' }} />
      <div className="skeleton-shimmer" style={{ width: '100px', height: '30px', borderRadius: '8px' }} />
    </div>
  </div>
);

export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} style={{ padding: '16px' }}>
        <div className="skeleton-shimmer" style={{ width: i === 0 ? '140px' : '80px', height: '16px' }} />
      </td>
    ))}
  </tr>
);

export const MetricSkeleton = () => (
  <div
    style={{
      padding: '20px',
      borderRadius: '16px',
      backgroundColor: 'var(--bg-glass, rgba(17, 27, 48, 0.78))',
      border: '1px solid var(--border-subtle)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div className="skeleton-shimmer" style={{ width: '100px', height: '14px' }} />
      <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
    </div>
    <div className="skeleton-shimmer" style={{ width: '60px', height: '30px', marginBottom: '8px' }} />
    <div className="skeleton-shimmer" style={{ width: '120px', height: '12px' }} />
  </div>
);

export default CardSkeleton;
