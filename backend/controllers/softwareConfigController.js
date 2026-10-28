/**
 * Software Configuration Controller (Phase 1 Foundation)
 * Provides centralized configuration metadata for PixxTechnologies' five core applications.
 * Uses explicit placeholder URLs until production endpoints are provided by the user.
 */

const coreApplications = [
  {
    id: 'app-pak-expense',
    name: 'Pakistan Expense Tracker',
    code: 'PAK_EXPENSE',
    category: 'Finance & Accounting',
    description: 'Corporate expenditure tracking, localized tax calculation, currency conversions, and receipt auditing for Pakistan operations.',
    status: 'Ready for Connection',
    environment: 'Staging / Placeholder',
    // Clearly marked configuration placeholder
    targetUrl: 'CONFIG_PLACEHOLDER://pak-expense.pixxtech.internal',
    iconType: 'receipt',
    colorTheme: 'cyan',
    version: '2.4.0',
    authType: 'Preserved Legacy Login (SSO in Phase 2)',
    isPlaceholder: true,
  },
  {
    id: 'app-uk-company',
    name: 'UK Company',
    code: 'UK_COMPANY',
    category: 'Corporate Administration',
    description: 'UK entity governance, statutory filing workflows, Companies House registry sync, and corporate compliance oversight.',
    status: 'Ready for Connection',
    environment: 'Staging / Placeholder',
    // Clearly marked configuration placeholder
    targetUrl: 'CONFIG_PLACEHOLDER://uk-company.pixxtech.internal',
    iconType: 'building',
    colorTheme: 'violet',
    version: '3.1.2',
    authType: 'Preserved Legacy Login (SSO in Phase 2)',
    isPlaceholder: true,
  },
  {
    id: 'app-rota-system',
    name: 'Rota System',
    code: 'ROTA_SYSTEM',
    category: 'Workforce & Shifts',
    description: 'Automated staff shift scheduling, attendance tracking, holiday allowances, and team rota conflict resolution.',
    status: 'Ready for Connection',
    environment: 'Staging / Placeholder',
    // Clearly marked configuration placeholder
    targetUrl: 'CONFIG_PLACEHOLDER://rota.pixxtech.internal',
    iconType: 'calendar',
    colorTheme: 'blue',
    version: '1.9.5',
    authType: 'Preserved Legacy Login (SSO in Phase 2)',
    isPlaceholder: true,
  },
  {
    id: 'app-bicycle-purchase',
    name: 'Bicycle Purchase System',
    code: 'BICYCLE_PURCHASE',
    category: 'Procurement & Logistics',
    description: 'Fleet inventory ordering, vendor quote comparison, purchase approval chains, and delivery verification.',
    status: 'Ready for Connection',
    environment: 'Staging / Placeholder',
    // Clearly marked configuration placeholder
    targetUrl: 'CONFIG_PLACEHOLDER://bicycle-procurement.pixxtech.internal',
    iconType: 'shopping-cart',
    colorTheme: 'emerald',
    version: '2.0.1',
    authType: 'Preserved Legacy Login (SSO in Phase 2)',
    isPlaceholder: true,
  },
  {
    id: 'app-task-manager',
    name: 'Task Manager',
    code: 'TASK_MANAGER',
    category: 'Project Execution',
    description: 'Cross-functional sprint coordination, milestone tracking, priority backlogs, and engineering delivery status.',
    status: 'Ready for Connection',
    environment: 'Staging / Placeholder',
    // Clearly marked configuration placeholder
    targetUrl: 'CONFIG_PLACEHOLDER://tasks.pixxtech.internal',
    iconType: 'check-square',
    colorTheme: 'amber',
    version: '4.0.0',
    authType: 'Preserved Legacy Login (SSO in Phase 2)',
    isPlaceholder: true,
  }
];

exports.getSoftwareList = (req, res) => {
  res.status(200).json({
    success: true,
    count: coreApplications.length,
    data: coreApplications,
    meta: {
      phase: 'Phase 1 - Foundation',
      note: 'URLs are configuration placeholders until production endpoints are assigned in Phase 2.',
      extensible: true
    }
  });
};

exports.getSoftwareById = (req, res) => {
  const app = coreApplications.find((a) => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({
      success: false,
      message: `Software with ID ${req.params.id} not found.`
    });
  }
  res.status(200).json({ success: true, data: app });
};
