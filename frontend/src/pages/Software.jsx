import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Upload, 
  UserPlus, 
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import SoftwareCard from '../components/SoftwareCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { CardSkeleton } from '../components/LoadingSkeleton';
import EmptyState, { ErrorState } from '../components/EmptyState';
import AppViewer from '../components/AppViewer';
import portalApi from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SAMPLE_PORTAL_SOFTWARE } from '../services/sampleData';

const INITIAL_ROLES = [
  'Boss',
  'Manager',
  'Assistant Manager',
  'Accountant',
  'Software Developer',
];

const SOFTWARE_CATEGORIES = [
  'Finance & Accounting',
  'Corporate Administration',
  'Workforce & Shifts',
  'Procurement & Logistics',
  'Project Execution',
];

/**
 * PixxTech Central Software Launchpad
 * Displays all authorized enterprise applications immediately at the top without searching.
 * Exclusively provides "Register User", "Register Application", and "Settings" to Rizwan.
 */
const Software = ({ onNavigate, activeViewingApp: externalViewingApp, onViewingAppChange }) => {
  const { currentUser, isRizwan } = useAuth();
  const toast = useToast();

  const [softwareList, setSoftwareList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // In-App Embedded Application Viewer State
  const [internalViewingApp, setInternalViewingApp] = useState(null);
  const activeViewingApp = externalViewingApp !== undefined ? externalViewingApp : internalViewingApp;
  const setActiveViewingApp = onViewingAppChange || setInternalViewingApp;

  // Modals state for Rizwan
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Application Registration State
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [appFormError, setAppFormError] = useState('');
  const [appFormData, setAppFormData] = useState({
    name: '',
    slug: '',
    category: 'Finance & Accounting',
    description: '',
    url: '',
    logoUrl: '',
    isActive: true,
  });

  // User Registration State
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Software Developer',
  });

  // Fetch software applications from MongoDB
  const fetchSoftware = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.getSoftware();
      if (res && res.success) {
        setSoftwareList(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to load software');
      }
    } catch (err) {
      console.warn('Software fetch error:', err.message);
      setError(err.message);
      // Fallback to sample apps if database connection is delayed
      if (currentUser?.role === 'Accountant') {
        setSoftwareList(
          SAMPLE_PORTAL_SOFTWARE.filter((s) =>
            ['pakistan-expense-tracker', 'rota-system'].includes(s.slug)
          )
        );
      } else {
        setSoftwareList(SAMPLE_PORTAL_SOFTWARE);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSoftware();
  }, [fetchSoftware]);

  // Handle Logo Upload via Cloudinary (for Rizwan)
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const res = await portalApi.uploadLogo(file);
      if (res && res.success) {
        setAppFormData((prev) => ({
          ...prev,
          logoUrl: res.data.secureUrl,
        }));
        toast.success('Logo uploaded to Cloudinary successfully.', 'Asset Manager');
      } else {
        throw new Error(res.message || 'Logo upload failed');
      }
    } catch (err) {
      setAppFormError(err.message || 'Failed to upload logo to Cloudinary');
      toast.error(err.message || 'Logo upload failed', 'Upload Error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Submit New Software Application (Rizwan only)
  const handleCreateSoftware = async (e) => {
    e.preventDefault();
    if (!appFormData.name) {
      setAppFormError('Software name is required.');
      return;
    }

    setAppSubmitting(true);
    setAppFormError('');

    try {
      await portalApi.createSoftware(appFormData);
      setIsAppModalOpen(false);
      setAppFormData({
        name: '',
        slug: '',
        category: 'Finance & Accounting',
        description: '',
        url: '',
        logoUrl: '',
        isActive: true,
      });
      toast.success(`Application "${appFormData.name}" successfully registered.`, 'Software Registry');
      fetchSoftware();
    } catch (err) {
      setAppFormError(err.message || 'Failed to register software record.');
      toast.error(err.message, 'Registry Error');
    } finally {
      setAppSubmitting(false);
    }
  };

  // Submit New User Registration (Rizwan only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email || !userFormData.password) {
      setUserFormError('Name, email, and password are required.');
      return;
    }
    if (userFormData.password.length < 6) {
      setUserFormError('Password must be at least 6 characters.');
      return;
    }

    setUserSubmitting(true);
    setUserFormError('');

    try {
      await portalApi.createUser(userFormData);
      setIsUserModalOpen(false);
      setUserFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'Software Developer',
      });
      toast.success(`User "${userFormData.name}" successfully created.`, 'User Governance');
    } catch (err) {
      setUserFormError(err.message || 'Failed to create user');
      toast.error(err.message, 'User Creation Error');
    } finally {
      setUserSubmitting(false);
    }
  };

  // Sort applications by sortOrder priority
  const displayApps = [...softwareList].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const isAccountant = currentUser?.role === 'Accountant';

  // If an application is selected for in-app viewing, display the responsive AppViewer
  if (activeViewingApp) {
    return (
      <AppViewer
        app={activeViewingApp}
        onBack={() => setActiveViewingApp(null)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant="cyan" size="sm">
              PIXX TECHNOLOGIES
            </Badge>
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
              Central Applications Gateway
            </span>
            {isAccountant && (
              <Badge variant="amber" size="sm">
                <Lock size={11} style={{ marginRight: '4px' }} />
                Accountant Scope
              </Badge>
            )}
          </div>
          <h1
            style={{
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary, #F5F7FF)',
            }}
          >
            Enterprise Applications
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #A5B1C8)', margin: '4px 0 0 0' }}>
            Click on any software card below to navigate directly to its platform.
          </p>
        </div>

        {/* Action Controls: Exclusively for Rizwan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isRizwan ? (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsAppModalOpen(true)}
              >
                Register Application
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={UserPlus}
                onClick={() => setIsUserModalOpen(true)}
              >
                Register User
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={SettingsIcon}
                onClick={() => onNavigate && onNavigate('settings')}
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={fetchSoftware}
                loading={loading}
                title="Refresh Application Status"
              />
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={fetchSoftware}
              loading={loading}
              title="Refresh Application Status"
            >
              Sync
            </Button>
          )}
        </div>
      </div>

      {/* Software Display Area: Front and Center on the Top */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error && displayApps.length === 0 ? (
        <ErrorState
          title="Applications Unavailable"
          message={error}
          onRetry={fetchSoftware}
        />
      ) : displayApps.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Authorized Applications Found"
          description="There are currently no active applications assigned to your account."
          actionLabel={isRizwan ? 'Register First Application' : undefined}
          onAction={isRizwan ? () => setIsAppModalOpen(true) : undefined}
          actionIcon={Plus}
        />
      ) : (
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
              onOpenApp={(appToOpen) => setActiveViewingApp(appToOpen)}
            />
          ))}
        </div>
      )}

      {/* Register Software Modal (Rizwan only) */}
      {isRizwan && (
        <Modal
          isOpen={isAppModalOpen}
          onClose={() => setIsAppModalOpen(false)}
          title="Register New Software Application"
          subtitle="Add an integrated system to the PixxTechnologies central gateway"
        >
          <form onSubmit={handleCreateSoftware} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appFormError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '12.5px',
                }}
              >
                {appFormError}
              </div>
            )}

            <Input
              label="Application Name"
              placeholder="e.g. Inventory Management System"
              value={appFormData.name}
              onChange={(e) => setAppFormData({ ...appFormData, name: e.target.value })}
              required
            />

            <Input
              label="URL Slug (Optional - auto-generated if blank)"
              placeholder="e.g. inventory-management"
              value={appFormData.slug}
              onChange={(e) => setAppFormData({ ...appFormData, slug: e.target.value })}
            />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={appFormData.category}
                onChange={(e) => setAppFormData({ ...appFormData, category: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  backgroundColor: 'var(--bg-surface-elevated, #162442)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                  borderRadius: '10px',
                  color: 'var(--text-primary, #F5F7FF)',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              >
                {SOFTWARE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Target Live URL"
              placeholder="https://example-app.vercel.app"
              value={appFormData.url}
              onChange={(e) => setAppFormData({ ...appFormData, url: e.target.value })}
            />

            {/* Cloudinary Logo Upload Slot */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Application Logo (Optional)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-subtle, rgba(255, 255, 255, 0.2))',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}
                  disabled={uploadingLogo}
                />
                {uploadingLogo && <span style={{ fontSize: '12px', color: 'var(--cyan-accent)' }}>Uploading...</span>}
                {appFormData.logoUrl && <Check size={16} color="#10B981" />}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Operational purpose and overview of this system..."
                value={appFormData.description}
                onChange={(e) => setAppFormData({ ...appFormData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface-elevated, #162442)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                  borderRadius: '10px',
                  color: 'var(--text-primary, #F5F7FF)',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsAppModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={appSubmitting}>
                Register System
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Register User Modal (Rizwan only) */}
      {isRizwan && (
        <Modal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          title="Register New Portal User"
          subtitle="Provision an authorized user account in the central authentication registry"
        >
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userFormError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '12.5px',
                }}
              >
                {userFormError}
              </div>
            )}

            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@gmail.com"
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              required
            />

            <Input
              label="Username (Optional)"
              placeholder="e.g. jdoe"
              value={userFormData.username}
              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              required
            />

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Role &amp; Access Tier
              </label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  backgroundColor: 'var(--bg-surface-elevated, #162442)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                  borderRadius: '10px',
                  color: 'var(--text-primary, #F5F7FF)',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              >
                {INITIAL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsUserModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={userSubmitting}>
                Register User
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Software;
