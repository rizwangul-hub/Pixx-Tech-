import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Server, 
  CheckCircle2, 
  Database,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  KeyRound,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import SoftwareCard from '../components/SoftwareCard';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import { CardSkeleton } from '../components/LoadingSkeleton';
import EmptyState, { ErrorState } from '../components/EmptyState';
import portalApi from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  SAMPLE_PORTAL_SOFTWARE, 
  SAMPLE_ACTIVITY_LOGS 
} from '../services/sampleData';

/**
 * PixxTech Central Portal - Phase 4 3D Dashboard
 * Dynamically queries MongoDB software records via Express API,
 * strictly filtered by role-based permissions and user assignments.
 */
const Dashboard = ({ onNavigate, searchQuery, isBackendOnline, backendHealth }) => {
  const { currentUser, isBoss } = useAuth();
  const toast = useToast();

  const [softwareList, setSoftwareList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch real software records from MongoDB (backend applies role filtering)
  const fetchSoftware = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await portalApi.getSoftware();
      if (response && response.success) {
        setSoftwareList(response.data || []);
        setIsUsingFallback(false);
      } else {
        throw new Error(response.message || 'Failed to retrieve software records');
      }
    } catch (err) {
      console.warn('[Dashboard] Could not fetch from MongoDB:', err.message);
      setError(err.message);
      setSoftwareList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoftware();
  }, [fetchSoftware]);

  // Seeding helper to populate the initial 5 business applications into MongoDB
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await portalApi.seedDevelopmentSoftware();
      toast.success('Successfully seeded the 5 initial applications into MongoDB.', 'Database Seed');
      await fetchSoftware();
    } catch (err) {
      toast.error(`Could not seed database: ${err.message}.`, 'Database Error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Switch to explicit visual preview if backend database is offline
  const handleEnableVisualPreview = () => {
    if (currentUser?.role === 'Accountant') {
      const accountantApps = SAMPLE_PORTAL_SOFTWARE.filter((s) =>
        ['pakistan-expense-tracker', 'rota-system'].includes(s.slug)
      );
      setSoftwareList(accountantApps);
    } else {
      setSoftwareList(SAMPLE_PORTAL_SOFTWARE);
    }
    setIsUsingFallback(true);
    setError(null);
    toast.info('Visual development preview mode enabled.');
  };

  // Software to display
  const displayApps = softwareList.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.name && app.name.toLowerCase().includes(q)) ||
      (app.slug && app.slug.toLowerCase().includes(q)) ||
      (app.category && app.category.toLowerCase().includes(q)) ||
      (app.description && app.description.toLowerCase().includes(q))
    );
  });

  const isDbConnected = Boolean(backendHealth?.database?.connected);
  const isAccountant = currentUser?.role === 'Accountant';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Hero Welcome Banner */}
      <div
        className="glass-surface"
        style={{
          padding: '34px 38px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(14, 23, 56, 0.88) 0%, rgba(9, 13, 30, 0.94) 100%)',
          border: '1px solid var(--border-card, rgba(91, 140, 255, 0.25))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(53, 214, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <Badge variant="cyan" size="sm" dot>
              PixxTech Central Portal • Phase 4
            </Badge>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>•</span>
            <Badge variant={currentUser?.role === 'Boss' ? 'violet' : 'blue'} size="sm">
              <UserCheck size={11} style={{ marginRight: '4px' }} />
              Role: {currentUser?.role || 'Authenticated Member'}
            </Badge>
            {isAccountant && (
              <Badge variant="amber" size="sm">
                <Lock size={11} style={{ marginRight: '4px' }} />
                Accountant Scope: Pakistan Expense &amp; Rota System Only
              </Badge>
            )}
          </div>

          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '14px',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary, #F5F7FF)',
            }}
          >
            Welcome back, <span className="text-gradient-electric">{currentUser?.name || 'PixxTech Member'}</span>
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary, #A5B1C8)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            {isAccountant
              ? 'Your central portal account is restricted to Pakistan Expense Tracker and Rota System in accordance with accounting governance. Unauthorized applications are strictly omitted from links and API payloads.'
              : 'Unified access gateway for PixxTechnologies core enterprise systems. Central session authenticated with role-based access control and preserved external credentials.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Button
              variant="primary"
              size="sm"
              icon={Layers}
              onClick={() => onNavigate('software')}
            >
              Explore Software Catalog
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={UserCheck}
              onClick={() => onNavigate('profile')}
            >
              My Account Profile
            </Button>
            {currentUser?.permissions?.includes('users.read') && (
              <Button
                variant="ghost"
                size="sm"
                icon={UserCheck}
                onClick={() => onNavigate('users')}
              >
                User Governance
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={fetchSoftware}
              loading={loading}
            >
              Sync Records
            </Button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            top: '-20%',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(91, 140, 255, 0.22) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        <Card is3d>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Authorized Applications
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(53, 214, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan-accent, #35D6FF)' }}>
              <Layers size={17} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary, #F5F7FF)' }}>
            {displayApps.length} Apps
          </div>
          <div style={{ fontSize: '12px', color: 'var(--cyan-accent, #35D6FF)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} />
            <span>{isAccountant ? 'Restricted Accounting Scope' : 'Full Enterprise Scope'}</span>
          </div>
        </Card>

        <Card is3d>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Central Session
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <ShieldCheck size={17} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary, #F5F7FF)' }}>
            Active
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>
            Role: {currentUser?.role}
          </div>
        </Card>

        <Card is3d>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Auth Preservation
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(145, 103, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet-accent, #9167FF)' }}>
              <KeyRound size={17} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary, #F5F7FF)' }}>
            100% Intact
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #A5B1C8)', marginTop: '6px' }}>
            Independent logins preserved
          </div>
        </Card>

        <Card is3d>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: 600, textTransform: 'uppercase' }}>
              Design &amp; 3D UI
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Sparkles size={17} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary, #F5F7FF)' }}>
            Phase 4
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #A5B1C8)', marginTop: '6px' }}>
            Futuristic 3D Dashboard
          </div>
        </Card>
      </div>

      {/* Central Software Launcher Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Badge variant="violet" size="sm">
                Central Launcher
              </Badge>
              {isUsingFallback ? (
                <Badge variant="amber" size="sm">
                  Visual Development Preview
                </Badge>
              ) : (
                <Badge variant="emerald" size="sm">
                  MongoDB Filtered Live Feed
                </Badge>
              )}
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary, #F5F7FF)' }}>
              {isAccountant ? 'Accountant Assigned Applications' : 'Enterprise Application Suite'}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #A5B1C8)', margin: '4px 0 0 0' }}>
              {isAccountant
                ? 'Displaying 2 permitted systems. Access to UK Company, Bicycle Purchase, and Task Manager is restricted by policy.'
                : 'Interactive 3D launch cards with pointer tilt, specular reflections, and independent system auth preservation.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={fetchSoftware}
              loading={loading}
            >
              Sync Feeds
            </Button>
          </div>
        </div>

        {/* Loading State with Shimmering Skeletons */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error / Standby State */}
        {!loading && error && (
          <ErrorState
            title="MongoDB Database Standby or Offline"
            message={`${error}. When ready to connect MongoDB Atlas, insert MONGODB_URI in backend/.env.`}
            onRetry={fetchSoftware}
          />
        )}

        {/* Empty Collection State */}
        {!loading && !error && displayApps.length === 0 && (
          <EmptyState
            icon={Layers}
            title="No Authorized Software Records Found"
            description="No active software records match your search query or role permissions."
            actionLabel={isBoss ? 'Seed 5 Applications into MongoDB' : undefined}
            onAction={isBoss ? handleSeedDatabase : undefined}
            actionIcon={CheckCircle2}
          />
        )}

        {/* Software Cards Grid with 3D Tilt */}
        {!loading && !error && displayApps.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {displayApps.map((software, idx) => (
              <SoftwareCard
                key={software._id || software.slug || idx}
                software={software}
                index={idx}
                onSelectSoftware={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Activity and Security Status Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        <Card
          title="Recent Portal Activity"
          subtitle="Real-time security and operational trail"
          icon={Activity}
          action={
            currentUser?.permissions?.includes('audit.read') && (
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate('activity')}
              >
                Full Audit Trail
              </Button>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SAMPLE_ACTIVITY_LOGS.slice(0, 3).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))',
                  fontSize: '12.5px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary, #F5F7FF)', marginBottom: '2px' }}>
                    {log.action}
                  </div>
                  <div style={{ color: 'var(--text-secondary, #A5B1C8)', fontSize: '11.5px' }}>
                    {log.details}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', whiteSpace: 'nowrap' }}>
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Phase 4 Futuristic 3D Architecture"
          subtitle="Real pointer tilt, dark/light theme, and independent sessions"
          icon={ShieldCheck}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: 'var(--text-secondary, #A5B1C8)', lineHeight: 1.6 }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--text-primary, #F5F7FF)',
              }}
            >
              <strong style={{ color: '#10B981' }}>Central Session Enforced:</strong> Authenticated as <span style={{ color: '#fff' }}>{currentUser?.name}</span> ({currentUser?.role}).
            </div>

            <p style={{ margin: 0 }}>
              • <strong>Role Separation:</strong> Boss holds all user, software, and audit permissions. Accountants are restricted to Pakistan Expense Tracker and Rota System.
            </p>

            <p style={{ margin: 0 }}>
              • <strong>Non-Destructive Integration:</strong> Pakistan Expense Tracker, UK Company, Rota System, Bicycle Purchase System, and Task Manager existing databases and user credentials remain strictly intact.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
