import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, ShieldCheck, CheckCircle2, RefreshCw, KeyRound, UserCheck, Layers } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';
import portalApi from '../services/api';
import { SAMPLE_ACTIVITY_LOGS } from '../services/sampleData';

/**
 * Live Security & Operational Audit Log Viewer
 * Phase 3: Displays authenticated audit trail from MongoDB ActivityLog collection
 */
const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');

  const entityTypes = ['All', 'Auth', 'User', 'Software', 'Upload', 'System'];

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.getAuditLogs({
        entityType: filterType,
        limit: 50,
      });
      if (res && res.success) {
        setLogs(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to retrieve audit trail');
      }
    } catch (err) {
      console.warn('Audit fetch error:', err.message);
      setError(err.message);
      // Fallback to sample logs for visual reference
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getEntityIcon = (type) => {
    switch (type) {
      case 'Auth':
        return <KeyRound size={16} color="#38bdf8" />;
      case 'User':
        return <UserCheck size={16} color="#a855f7" />;
      case 'Software':
        return <Layers size={16} color="#10b981" />;
      default:
        return <Activity size={16} color="#64748b" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="blue" size="sm">
              Audit Stream
            </Badge>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Phase 3 Security &amp; Activity Logging
            </span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Security &amp; Operational Audit Trail
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
            Immutable MongoDB audit records tracking logins, session updates, role assignments, and software changes.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchLogs}
          loading={loading}
        >
          Refresh Audit Trail
        </Button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {entityTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: filterType === type ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              color: filterType === type ? '#38bdf8' : '#94a3b8',
              border: filterType === type ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.18s ease',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <Card title="Live Event Stream" subtitle="Sanitized logs strictly excluding passwords, cookies, or secrets">
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <Loading size="md" text="Loading audit records from MongoDB..." />
          </div>
        ) : error && logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', fontSize: '13px' }}>
              Database offline: Showing sample historical activity records.
            </div>
            {SAMPLE_ACTIVITY_LOGS.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                    {log.details}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{log.timestamp}</span>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No audit records found for the selected entity type.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.map((log) => (
              <div
                key={log._id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getEntityIcon(log.entityType)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                        {log.action}
                      </span>
                      <Badge variant="cyan" size="sm">
                        {log.entityType}
                      </Badge>
                      {log.actorUserId && (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          by {log.actorUserId.name} ({log.actorUserId.role})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                      {log.details ? JSON.stringify(log.details) : 'No details recorded'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                  <Clock size={12} />
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ActivityLogs;
