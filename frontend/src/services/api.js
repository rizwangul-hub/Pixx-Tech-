/**
 * PixxTech Central Portal - API Client Service
 * Phase 3: Session Authentication, Users, Software & Audit Management
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEV_KEY = 'dev_secret_pixxtech_phase2';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-internal-dev-key': DEV_KEY,
    ...options.headers,
  };

  // If body is FormData (e.g. image upload), let browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Include session cookies across origins
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const res = await fetch(url, fetchOptions);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    // Suppress console warning for standard 401 Unauthorized during initial session check (/auth/me)
    const isNormalUnauthenticatedCheck = endpoint === '/auth/me' && error.status === 401;

    if (!isNormalUnauthenticatedCheck) {
      console.warn(`[Portal API Error] ${endpoint}:`, error.message);
    }
    throw error;
  }
}

export const portalApi = {
  // System Health
  getHealth: () => request('/health'),

  // Authentication & Session
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  changePassword: (payload) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bootstrapAdmin: (payload, secret) =>
    request('/auth/bootstrap', {
      method: 'POST',
      headers: {
        'x-bootstrap-secret': secret || 'pixxtech_initial_bootstrap_secret_2026',
      },
      body: JSON.stringify(payload),
    }),

  // User Management
  getUsers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.role && params.role !== 'All') qs.append('role', params.role);
    if (params.isActive !== undefined) qs.append('isActive', params.isActive);
    if (params.search) qs.append('search', params.search);
    if (params.page) qs.append('page', params.page);
    if (params.limit) qs.append('limit', params.limit);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/users${queryString}`);
  },

  getUserById: (id) => request(`/users/${id}`),

  createUser: (payload) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (id, payload) =>
    request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateUserStatus: (id, isActive) =>
    request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.entityType && params.entityType !== 'All') qs.append('entityType', params.entityType);
    if (params.action) qs.append('action', params.action);
    if (params.page) qs.append('page', params.page);
    if (params.limit) qs.append('limit', params.limit);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/audit${queryString}`);
  },

  // Software Catalog (MongoDB)
  getSoftware: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.category && params.category !== 'All') qs.append('category', params.category);
    if (params.search) qs.append('search', params.search);
    if (params.isActive !== undefined) qs.append('isActive', params.isActive);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/software${queryString}`);
  },

  getSoftwareById: (id) => request(`/software/${id}`),

  launchSoftware: (id) =>
    request(`/software/${id}/launch`, {
      method: 'POST',
    }),

  createSoftware: (payload) =>
    request('/software', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSoftware: (id, payload) =>
    request(`/software/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteSoftware: (id) =>
    request(`/software/${id}`, {
      method: 'DELETE',
    }),

  seedDevelopmentSoftware: () =>
    request('/software/seed-development', {
      method: 'POST',
    }),

  // Image Uploads (Cloudinary backend proxy)
  uploadSoftwareLogo: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/uploads/software-logo', {
      method: 'POST',
      body: formData,
    });
  },

  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/uploads/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  // Single Sign-On (SSO) Services (Phase 5)
  initiateSSO: (payload) =>
    request('/sso/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifySSO: (payload) =>
    request('/sso/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSSOStatus: (softwareId) => request(`/sso/status/${softwareId}`),
};

export default portalApi;
