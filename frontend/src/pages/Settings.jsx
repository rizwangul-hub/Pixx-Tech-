import React, { useState } from 'react';
import { Settings as SettingsIcon, Server, Shield, Database, RefreshCw, CheckCircle2, AlertCircle, KeyRound, UserCheck, Lock } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import portalApi from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Settings & Security Diagnostics Page
 * Phase 3: System Health Diagnostics + User Security & Password Management
 */
const Settings = ({ isBackendOnline, backendHealth, onRefreshHealth }) => {
  const { currentUser, isBoss } = useAuth();
  const [testingHealth, setTestingHealth] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState(null);

  const handleTestHealth = async () => {
    setTestingHealth(true);
    setTestResult(null);
    try {
      const data = await portalApi.getHealth();
      setTestResult({ success: true, data });
      if (onRefreshHealth) onRefreshHealth();
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingHealth(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage(null);

    if (newPassword.length < 8) {
      setPwdMessage({ type: 'error', text: 'New password must be at least 8 characters in length.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await portalApi.changePassword({ currentPassword, newPassword });
      setPwdMessage({ type: 'success', text: res.message || 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const isDbConnected = Boolean(backendHealth?.database?.connected);
  const isCloudinaryReady = Boolean(backendHealth?.cloudinary?.configured);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Badge variant="blue" size="sm">
            Configuration &amp; Security
          </Badge>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Phase 3 RBAC &amp; Central Access
          </span>
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
          System &amp; Account Settings
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
          Central identity security, session profile, and infrastructure diagnostics.
        </p>
      </div>

      {/* Account Profile & Security Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <Card title="Active Session Identity" subtitle="Authenticated user profile and role assignments" icon={UserCheck}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Full Name</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                {currentUser?.name || 'PixxTech Member'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Corporate Email</span>
              <div style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                {currentUser?.email || 'N/A'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Assigned Portal Role</span>
              <div style={{ marginTop: '4px' }}>
                <Badge variant={isBoss ? 'violet' : 'cyan'} size="sm">
                  {currentUser?.role || 'Viewer'}
                </Badge>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Granted Administrative Permissions</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {currentUser?.permissions && currentUser.permissions.length > 0 ? (
                  currentUser.permissions.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: '11px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Standard Access (Software Launch Only)</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card title="Portal Password Security" subtitle="Update your central portal access credential" icon={KeyRound}>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pwdMessage && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  backgroundColor: pwdMessage.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${pwdMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  color: pwdMessage.type === 'error' ? '#fca5a5' : '#86efac',
                }}
              >
                {pwdMessage.text}
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

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={pwdLoading}
              icon={Lock}
            >
              Update Security Password
            </Button>
          </form>
        </Card>
      </div>

      {/* Backend & Cloud Diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Express Server Diagnostic */}
        <Card
          title="Express API Core"
          subtitle="http://localhost:5000/api"
          icon={Server}
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={testingHealth}
              onClick={handleTestHealth}
            >
              Test Probe
            </Button>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isBackendOnline ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 10px ${isBackendOnline ? '#10b981' : '#f59e0b'}`,
              }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {isBackendOnline ? 'Express Server Operational' : 'Server Standby'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {backendHealth?.uptime ? `Uptime: ${backendHealth.uptime}s • Version ${backendHealth.version}` : 'Port 5000'}
              </div>
            </div>
          </div>
        </Card>

        {/* MongoDB Database Diagnostic */}
        <Card
          title="MongoDB Database"
          subtitle="Mongoose connection state"
          icon={Database}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isDbConnected ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 10px ${isDbConnected ? '#10b981' : '#f59e0b'}`,
              }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {isDbConnected ? 'MongoDB Atlas Connected' : 'Database Standby / Offline'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {isDbConnected
                  ? `Host: ${backendHealth?.database?.host || 'MongoDB Atlas'}`
                  : 'Awaiting MONGODB_URI in backend/.env'}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
