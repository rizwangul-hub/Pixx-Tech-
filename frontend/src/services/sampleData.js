/**
 * ==============================================================================
 * PIXXTECH CENTRAL PORTAL - PHASE 1 SAMPLE DATA FOR VISUAL DEVELOPMENT ONLY
 * ==============================================================================
 * Note: This sample dataset is strictly separated from backend APIs.
 * In Phase 2, this will be replaced with real MongoDB documents and SSO endpoints.
 * All application URLs below use explicit CONFIG_PLACEHOLDER strings as requested.
 * ==============================================================================
 */

export const SAMPLE_PORTAL_SOFTWARE = [
  {
    id: 'app-pakistan-expense',
    name: 'Pakistan Expense Tracker',
    code: 'PAK_EXPENSE',
    category: 'Finance & Accounting',
    description: 'Corporate expenditure tracking, localized tax calculation, currency conversions, and receipt auditing for Pakistan operations.',
    version: 'v2.4.0',
    status: 'Ready for Connection',
    statusType: 'configured',
    url: 'https://pixxtech-expense-tracker-fz2h.vercel.app',
    targetUrlPlaceholder: 'https://pixxtech-expense-tracker-fz2h.vercel.app',
    iconType: 'Receipt',
    colorTheme: 'cyan',
    accentColor: '#06b6d4',
    authNote: 'Preserved Legacy Login (SSO in Phase 2)',
    metrics: [
      { label: 'Active Reports', value: '42' },
      { label: 'Pending Audits', value: '8' },
      { label: 'Local Currency', value: 'PKR' },
    ],
    tags: ['Expense', 'Tax', 'Auditing', 'Invoicing'],
    lastUpdated: '12 mins ago'
  },
  {
    id: 'app-uk-company',
    name: 'UK Company',
    code: 'UK_COMPANY',
    category: 'Corporate Administration',
    description: 'UK entity governance, statutory filing workflows, Companies House registry sync, and corporate compliance oversight.',
    version: 'v3.1.2',
    status: 'Ready for Connection',
    statusType: 'configured',
    url: 'https://uk-companies.vercel.app',
    targetUrlPlaceholder: 'https://uk-companies.vercel.app',
    iconType: 'Building',
    colorTheme: 'violet',
    accentColor: '#8b5cf6',
    authNote: 'Preserved Legacy Login (SSO in Phase 2)',
    metrics: [
      { label: 'Active Entities', value: '4' },
      { label: 'Next Filing', value: '18 Days' },
      { label: 'Compliance Score', value: '99.4%' },
    ],
    tags: ['UK Gov', 'Compliance', 'Companies House', 'Legal'],
    lastUpdated: '1 hour ago'
  },
  {
    id: 'app-rota-system',
    name: 'Rota System',
    code: 'ROTA_SYSTEM',
    category: 'Workforce & Shifts',
    description: 'Automated staff shift scheduling, attendance tracking, holiday allowances, and team rota conflict resolution.',
    version: 'v1.9.5',
    status: 'Ready for Connection',
    statusType: 'configured',
    url: 'https://rota-system-eka1-eight.vercel.app',
    targetUrlPlaceholder: 'https://rota-system-eka1-eight.vercel.app',
    iconType: 'Calendar',
    colorTheme: 'blue',
    accentColor: '#38bdf8',
    authNote: 'Preserved Legacy Login (SSO in Phase 2)',
    metrics: [
      { label: 'Active Shifts', value: '28' },
      { label: 'Scheduled Staff', value: '54' },
      { label: 'Coverage', value: '100%' },
    ],
    tags: ['Scheduling', 'Shifts', 'Timesheets', 'HR'],
    lastUpdated: 'Just now'
  },
  {
    id: 'app-bicycle-purchase',
    name: 'Bicycle Purchase System',
    code: 'BICYCLE_PURCHASE',
    category: 'Procurement & Logistics',
    description: 'Fleet inventory ordering, vendor quote comparison, purchase approval chains, and delivery verification.',
    version: 'v2.0.1',
    status: 'Ready for Connection',
    statusType: 'configured',
    url: 'https://bicycle-uuue.vercel.app',
    targetUrlPlaceholder: 'https://bicycle-uuue.vercel.app',
    iconType: 'ShoppingCart',
    colorTheme: 'emerald',
    accentColor: '#10b981',
    authNote: 'Preserved Legacy Login (SSO in Phase 2)',
    metrics: [
      { label: 'Open POs', value: '16' },
      { label: 'Fleet In Transit', value: '35' },
      { label: 'Approved Today', value: '3' },
    ],
    tags: ['Procurement', 'Inventory', 'Fleet', 'Vendors'],
    lastUpdated: '35 mins ago'
  },
  {
    id: 'app-task-manager',
    name: 'Task Manager',
    code: 'TASK_MANAGER',
    category: 'Project Execution',
    description: 'Cross-functional sprint coordination, milestone tracking, priority backlogs, and engineering delivery status.',
    version: 'v4.0.0',
    status: 'Ready for Connection',
    statusType: 'configured',
    url: 'https://task-manager-flame-five-73.vercel.app',
    targetUrlPlaceholder: 'https://task-manager-flame-five-73.vercel.app',
    iconType: 'CheckSquare',
    colorTheme: 'amber',
    accentColor: '#f59e0b',
    authNote: 'Preserved Legacy Login (SSO in Phase 2)',
    metrics: [
      { label: 'Active Sprints', value: '3' },
      { label: 'In Progress', value: '47' },
      { label: 'Sprint Velocity', value: '94%' },
    ],
    tags: ['Agile', 'Sprints', 'Backlog', 'Execution'],
    lastUpdated: '5 mins ago'
  }
];

export const SAMPLE_DASHBOARD_STATS = {
  totalManagedApps: 5,
  connectedStatus: 'All 5 Configured',
  systemHealthPercent: 99.98,
  totalTeamMembers: 64,
  portalPhase: 'Phase 1 - Foundation & Premium UI',
};

export const SAMPLE_ACTIVITY_LOGS = [
  {
    id: 'act-001',
    appName: 'Rota System',
    appCode: 'ROTA_SYSTEM',
    action: 'Shift Rota Published',
    details: 'Weekly engineering rota published for Team Alpha (18 shift slots confirmed)',
    timestamp: '14 minutes ago',
    type: 'success',
    user: 'Maya Lin'
  },
  {
    id: 'act-002',
    appName: 'UK Company',
    appCode: 'UK_COMPANY',
    action: 'Compliance Check Passed',
    details: 'Automated verification check passed for Q2 Companies House statements',
    timestamp: '42 minutes ago',
    type: 'info',
    user: 'System Bot'
  },
  {
    id: 'act-003',
    appName: 'Pakistan Expense Tracker',
    appCode: 'PAK_EXPENSE',
    action: 'Audit Log Exported',
    details: 'Monthly withholding tax report generated for Lahore operations center',
    timestamp: '1 hour ago',
    type: 'info',
    user: 'Tariq Mehmood'
  },
  {
    id: 'act-004',
    appName: 'Bicycle Purchase System',
    appCode: 'BICYCLE_PURCHASE',
    action: 'Purchase Order Approved',
    details: 'PO-8842 for 15 urban delivery units approved by Finance Director',
    timestamp: '2 hours ago',
    type: 'success',
    user: 'Sarah Jenkins'
  },
  {
    id: 'act-005',
    appName: 'Task Manager',
    appCode: 'TASK_MANAGER',
    action: 'Milestone Completed',
    details: 'Sprint 24 core backend services successfully merged to staging branch',
    timestamp: '3 hours ago',
    type: 'warning',
    user: 'Julian Gomez'
  }
];

export const SAMPLE_USER_PROFILE = {
  name: 'Alex Sterling',
  role: 'Enterprise Administrator',
  email: 'alex.sterling@pixxtech.internal',
  department: 'Central Technology Pod',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  notificationsCount: 3,
};
