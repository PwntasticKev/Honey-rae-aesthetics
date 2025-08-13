// Mock Convex API for testing

export const api = {
  users: {
    getByEmail: 'users:getByEmail',
    create: 'users:create',
    update: 'users:update',
  },
  orgs: {
    get: 'orgs:get',
    create: 'orgs:create',
    update: 'orgs:update',
    updateTheme: 'orgs:updateTheme',
  },
  workflows: {
    list: 'workflows:list',
    get: 'workflows:get',
    create: 'workflows:create',
    update: 'workflows:update',
    delete: 'workflows:delete',
    getWorkflowUserTracking: 'workflows:getWorkflowUserTracking',
  },
  enhancedWorkflows: {
    getWorkflows: 'enhancedWorkflows:getWorkflows',
    getWorkflowEnrollments: 'enhancedWorkflows:getWorkflowEnrollments',
    getExecutionLogs: 'enhancedWorkflows:getExecutionLogs',
    getWorkflowStats: 'enhancedWorkflows:getWorkflowStats',
    createWorkflow: 'enhancedWorkflows:createWorkflow',
    updateWorkflowStatus: 'enhancedWorkflows:updateWorkflowStatus',
  },
  workflowDirectories: {
    getDirectories: 'workflowDirectories:getDirectories',
    getArchivedDirectories: 'workflowDirectories:getArchivedDirectories',
    createDirectory: 'workflowDirectories:createDirectory',
    updateDirectory: 'workflowDirectories:updateDirectory',
    deleteDirectory: 'workflowDirectories:deleteDirectory',
    restoreDirectory: 'workflowDirectories:restoreDirectory',
    permanentlyDeleteDirectory: 'workflowDirectories:permanentlyDeleteDirectory',
    renameDirectory: 'workflowDirectories:renameDirectory',
    moveDirectory: 'workflowDirectories:moveDirectory',
    moveWorkflowToDirectory: 'workflowDirectories:moveWorkflowToDirectory',
  },
  messageTemplates: {
    getByOrg: 'messageTemplates:getByOrg',
    create: 'messageTemplates:create',
  },
  clients: {
    list: 'clients:list',
    get: 'clients:get',
    create: 'clients:create',
    update: 'clients:update',
    importClients: 'clients:importClients',
    exportClients: 'clients:exportClients',
  },
  appointments: {
    list: 'appointments:list',
    get: 'appointments:get',
    create: 'appointments:create',
    update: 'appointments:update',
  },
  notifications: {
    list: 'notifications:list',
    create: 'notifications:create',
    markAsRead: 'notifications:markAsRead',
  },
  search: {
    global: 'search:global',
    clients: 'search:clients',
    appointments: 'search:appointments',
    workflows: 'search:workflows',
  },
}