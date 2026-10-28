/**
 * PixxTech Central Portal - Role-Based Access Control (RBAC) & Application Governance
 * Phase 3: Central Authentication & Permissions
 */

const ROLES = Object.freeze({
  BOSS: 'Boss',
  MANAGER: 'Manager',
  ASSISTANT_MANAGER: 'Assistant Manager',
  ACCOUNTANT: 'Accountant',
  SOFTWARE_DEVELOPER: 'Software Developer',
});

const PERMISSIONS = Object.freeze({
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DEACTIVATE: 'users.deactivate',
  SOFTWARE_READ: 'software.read',
  SOFTWARE_MANAGE: 'software.manage',
  AUDIT_READ: 'audit.read',
  PORTAL_SETTINGS_MANAGE: 'portal.settings.manage',
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.BOSS]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DEACTIVATE,
    PERMISSIONS.SOFTWARE_READ,
    PERMISSIONS.SOFTWARE_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.PORTAL_SETTINGS_MANAGE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.SOFTWARE_READ,
    PERMISSIONS.USERS_READ,
  ],
  [ROLES.ASSISTANT_MANAGER]: [
    PERMISSIONS.SOFTWARE_READ,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.SOFTWARE_READ,
  ],
  [ROLES.SOFTWARE_DEVELOPER]: [
    PERMISSIONS.SOFTWARE_READ,
  ],
});

// The five central portal business applications (preserved external architectures)
const APP_SLUGS = Object.freeze({
  PAKISTAN_EXPENSE: 'pakistan-expense-tracker',
  UK_COMPANY: 'uk-company',
  ROTA_SYSTEM: 'rota-system',
  BICYCLE_PURCHASE: 'bicycle-purchase-system',
  TASK_MANAGER: 'task-manager',
});

// Application accessibility by role:
// Accountant has access ONLY to Pakistan Expense Tracker and Rota System.
// Boss, Manager, Assistant Manager, and Software Developer have access to all 5.
const ROLE_ALLOWED_SLUGS = Object.freeze({
  [ROLES.BOSS]: [
    APP_SLUGS.PAKISTAN_EXPENSE,
    APP_SLUGS.UK_COMPANY,
    APP_SLUGS.ROTA_SYSTEM,
    APP_SLUGS.BICYCLE_PURCHASE,
    APP_SLUGS.TASK_MANAGER,
  ],
  [ROLES.MANAGER]: [
    APP_SLUGS.PAKISTAN_EXPENSE,
    APP_SLUGS.UK_COMPANY,
    APP_SLUGS.ROTA_SYSTEM,
    APP_SLUGS.BICYCLE_PURCHASE,
    APP_SLUGS.TASK_MANAGER,
  ],
  [ROLES.ASSISTANT_MANAGER]: [
    APP_SLUGS.PAKISTAN_EXPENSE,
    APP_SLUGS.UK_COMPANY,
    APP_SLUGS.ROTA_SYSTEM,
    APP_SLUGS.BICYCLE_PURCHASE,
    APP_SLUGS.TASK_MANAGER,
  ],
  [ROLES.ACCOUNTANT]: [
    APP_SLUGS.PAKISTAN_EXPENSE,
    APP_SLUGS.ROTA_SYSTEM,
  ],
  [ROLES.SOFTWARE_DEVELOPER]: [
    APP_SLUGS.PAKISTAN_EXPENSE,
    APP_SLUGS.UK_COMPANY,
    APP_SLUGS.ROTA_SYSTEM,
    APP_SLUGS.BICYCLE_PURCHASE,
    APP_SLUGS.TASK_MANAGER,
  ],
});

/**
 * Checks whether a given role holds a specific administrative permission
 */
const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
};

/**
 * Checks whether a user role is permitted to view or launch an application by slug
 */
const isSoftwareAllowedByRole = (role, slug) => {
  if (!role || !slug) return false;
  const allowed = ROLE_ALLOWED_SLUGS[role] || [];
  return allowed.includes(slug.toLowerCase().trim());
};

/**
 * Normalizes legacy role strings to canonical Phase 3 roles
 */
const normalizeRole = (role) => {
  if (!role) return ROLES.SOFTWARE_DEVELOPER;
  const lower = role.toLowerCase().trim();
  if (lower === 'boss' || lower === 'admin') return ROLES.BOSS;
  if (lower === 'manager') return ROLES.MANAGER;
  if (lower === 'assistant manager' || lower === 'assistant-manager') return ROLES.ASSISTANT_MANAGER;
  if (lower === 'accountant') return ROLES.ACCOUNTANT;
  if (lower === 'software developer' || lower === 'developer') return ROLES.SOFTWARE_DEVELOPER;
  return role;
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  APP_SLUGS,
  ROLE_ALLOWED_SLUGS,
  hasPermission,
  isSoftwareAllowedByRole,
  normalizeRole,
};
