import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import portalApi from '../services/api';

/**
 * Dedicated Profile & Account Governance Page
 * Phase 4: Secure user identity, application access matrix, and password management
 */
const Profile = () => {
  const { currentUser, isBoss } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const isAccountant = currentUser?.role === 'Accountant';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await portalApi.changePassword({ currentPassword, newPassword });
      toast.success(res.message || 'Password successfully updated.', 'Security');
      setStatusMessage({ type: 'success', text: res.message || 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.', 'Security Error');
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const displayName = currentUser?.name || 'PixxTech Team Member';
  const displayRole = currentUser?.role || 'Viewer';
  const displayEmail = currentUser?.email || 'N/A';
  const avatarUrl = currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=35D6FF&color=070B17&bold=true`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Badge variant="cyan" size="sm">
            Personnel Profile
          </Badge>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
            Central Identity Governance
          </span>
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          Account &amp; Security Profile
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary, #A5B1C8)', marginTop: '6px', margin: 0 }}>
          Manage your central portal profile, view active application authorizations, and update credentials.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Profile Details Card */}
        <Card title="Corporate Identity" subtitle="Authenticated portal account credentials" icon={User}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={avatarUrl}
                alt={displayName}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  objectFit: 'cover',
                  border: '2px solid var(--primary-accent, #5B8CFF)',
                  boxShadow: '0 4px 15px rgba(91, 140, 255, 0.25)',
                }}
              />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary, #F5F7FF)', margin: '0 0 4px 0' }}>
                  {displayName}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge variant={isBoss ? 'violet' : 'blue'} size="sm">
                    {displayRole}
                  </Badge>
                  <Badge variant={currentUser?.isActive !== false ? 'emerald' : 'rose'} size="sm" dot>
                    {currentUser?.isActive !== false ? 'Active' : 'Deactivated'}
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Corporate Email</span>
                <div style={{ fontSize: '14px', color: 'var(--text-primary, #F5F7FF)', fontWeight: 500 }}>
                  {displayEmail}
                </div>
              </div>

              {currentUser?.username && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Username</span>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary, #F5F7FF)', fontFamily: 'var(--font-mono)' }}>
                    {currentUser.username}
                  </div>
                </div>
              )}

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>Last Login Timestamp</span>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #A5B1C8)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Clock size={13} />
                  <span>{currentUser?.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Current Session'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Access Summary Card */}
        <Card title="Application Access Scope" subtitle="Systems authorized under your role" icon={Layers}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: isAccountant ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${isAccountant ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                fontSize: '12.5px',
                color: 'var(--text-secondary, #A5B1C8)',
                lineHeight: 1.55,
              }}
            >
              {isAccountant ? (
                <>
                  <strong style={{ color: '#F59E0B' }}>Accountant Scope:</strong> Authorized for Pakistan Expense Tracker and Rota System only. Access to UK Company, Bicycle Purchase, and Task Manager is restricted by corporate policy.
                </>
              ) : (
                <>
                  <strong style={{ color: '#10B981' }}>Full Access Scope:</strong> You hold launch authorizations for all 5 enterprise business systems.
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 600, textTransform: 'uppercase' }}>
                System Permissions List
              </div>
              {[
                { name: 'Pakistan Expense Tracker', allowed: true },
                { name: 'Rota System', allowed: true },
                { name: 'UK Company / UK Expense Tracker', allowed: !isAccountant },
                { name: 'Bicycle Purchase System', allowed: !isAccountant },
                { name: 'Task Manager', allowed: !isAccountant },
              ].map((sys, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: sys.allowed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {sys.name}
                  </span>
                  <Badge variant={sys.allowed ? 'emerald' : 'rose'} size="sm" dot>
                    {sys.allowed ? 'Authorized' : 'Restricted'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card title="Change Security Password" subtitle="Update your central portal login credential" icon={KeyRound}>
        <form onSubmit={handleChangePassword} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                backgroundColor: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: statusMessage.type === 'error' ? '#fca5a5' : '#86efac',
              }}
            >
              {statusMessage.text}
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Security Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              icon={Lock}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
