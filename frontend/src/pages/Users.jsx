import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users as UsersIcon, 
  ShieldCheck, 
  Lock, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Loading from '../components/Loading';
import portalApi from '../services/api';
import { useAuth } from '../context/AuthContext';

const INITIAL_ROLES = [
  'Boss',
  'Manager',
  'Assistant Manager',
  'Accountant',
  'Software Developer',
];

/**
 * Real Central User Management & Role Governance
 * Phase 3: Central Authentication, RBAC & Application Access Assignments
 */
const Users = () => {
  const { currentUser, isBoss } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Software Developer',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await portalApi.getUsers({
        search,
        role: roleFilter,
      });
      if (res && res.success) {
        setUsers(res.data || []);
      } else {
        throw new Error(res.message || 'Failed to load users');
      }
    } catch (err) {
      console.warn('User fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    if (user.role === 'Boss' && user.isActive) {
      const activeBosses = users.filter((u) => u.role === 'Boss' && u.isActive);
      if (activeBosses.length <= 1) {
        alert('Action prevented: You cannot deactivate the sole active Boss account. Organization must maintain an active administrator.');
        return;
      }
    }

    const actionName = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} account for ${user.name}?`)) {
      return;
    }

    try {
      await portalApi.updateUserStatus(user.id, !user.isActive);
      fetchUsers();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Name, corporate email, and password are required.');
      return;
    }
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters in length.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await portalApi.createUser(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'Software Developer',
      });
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Boss':
        return 'violet';
      case 'Manager':
        return 'blue';
      case 'Assistant Manager':
        return 'cyan';
      case 'Accountant':
        return 'amber';
      case 'Software Developer':
        return 'emerald';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="violet" size="sm">
              Access Governance
            </Badge>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Phase 3 Central Identity &amp; RBAC
            </span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Users &amp; Role Governance
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
            Centralized portal directory with database-enforced permissions and non-destructive external app preservation.
          </p>
        </div>

        {isBoss && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            Provision User
          </Button>
        )}
      </div>

      {/* Preservation Policy Banner */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <ShieldCheck size={22} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
          <strong style={{ color: '#34d399' }}>Authentication Preservation Guarantee:</strong> Central portal accounts, roles, and password hashes are strictly segregated from existing business systems. Passwords and logins for Pakistan Expense Tracker, UK Company, Rota System, Bicycle Purchase System, and Task Manager are never modified, overwritten, or invalidated.
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                paddingLeft: '36px',
                paddingRight: '12px',
                background: 'rgba(11, 16, 38, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              height: '38px',
              padding: '0 14px',
              background: 'rgba(11, 16, 38, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="All">All Roles</option>
            {INITIAL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchUsers}
          loading={loading}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Users Table */}
      <Card title="Portal Personnel Directory" subtitle="MongoDB live user records and application authorizations">
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <Loading size="md" text="Loading users from MongoDB..." />
          </div>
        ) : error ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#f59e0b', fontSize: '13.5px' }}>
            {error}. Ensure MongoDB is connected and user session is active.
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No users found matching current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Personnel &amp; Corporate Email</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Portal Role</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Application Scope</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Account Status</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Last Login</th>
                  {isBoss && <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px' }}>
                      {u.role === 'Accountant' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                            2 Applications (Restricted):
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                            Pakistan Expense Tracker, Rota System
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#38bdf8' }}>
                          All 5 Applications Authorized
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <Badge variant={u.isActive ? 'emerald' : 'rose'} size="sm" dot>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px', color: '#94a3b8', fontSize: '12px' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    {isBoss && (
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <Button
                          variant={u.isActive ? 'ghost' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            color: u.isActive ? '#fb7185' : '#34d399',
                            fontSize: '12px',
                          }}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Provision New User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Central Portal User"
        subtitle="Create verified account with role and application authorization"
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '12.5px',
              }}
            >
              {formError}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Fahad Rasheed"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Corporate Email Address"
            type="email"
            placeholder="e.g. fahad.rasheed@pixxtech.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Username (Optional)"
            placeholder="e.g. fahadr"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          <Input
            label="Temporary Security Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
              Portal Role Assignment
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                backgroundColor: '#0c1228',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
              }}
            >
              {INITIAL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r} {r === 'Accountant' ? '(Pakistan Expense & Rota Only)' : '(All 5 Apps)'}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '12px',
              color: '#cbd5e1',
              lineHeight: 1.5,
            }}
          >
            <strong>Role Policy:</strong> If selected as <strong>Accountant</strong>, this user will only have access to Pakistan Expense Tracker and Rota System. Passwords inside the individual applications remain separate.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
