import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Convex API
vi.mock('@/convex/_generated/api', () => ({
  api: {
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
    },
    enhancedWorkflows: {
      getWorkflows: 'enhancedWorkflows:getWorkflows',
      getWorkflowEnrollments: 'enhancedWorkflows:getWorkflowEnrollments',
      getExecutionLogs: 'enhancedWorkflows:getExecutionLogs',
      getWorkflowStats: 'enhancedWorkflows:getWorkflowStats',
      createWorkflow: 'enhancedWorkflows:createWorkflow',
    },
    workflowDirectories: {
      getDirectories: 'workflowDirectories:getDirectories',
      createDirectory: 'workflowDirectories:createDirectory',
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
    auth: {
      loginWithEmail: 'auth:loginWithEmail',
      loginWithGoogle: 'auth:loginWithGoogle',
      verifyOTP: 'auth:verifyOTP',
      createAccount: 'auth:createAccount',
      logout: 'auth:logout',
      getCurrentUser: 'auth:getCurrentUser',
      createTestOrg: 'auth:createTestOrg',
    },
  },
}))

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => {
  const mockAuthHook = {
    user: {
      userId: 'test_user_123456789',
      email: 'admin@test.local',
      name: 'Test Admin',
      role: 'admin',
    },
    orgId: 'test_org_123456789',
    organization: {
      name: 'Test Aesthetics Clinic',
      logo: undefined,
    },
    isLoading: false,
    isAuthenticated: true,
    sessionToken: 'test_session_token',
    login: vi.fn().mockResolvedValue({ success: true }),
    loginWithGoogle: vi.fn().mockResolvedValue({ success: true }),
    verifyOTP: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    createAccount: vi.fn().mockResolvedValue({ success: true }),
  };

  return {
    useAuth: () => mockAuthHook,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  };
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js image component
vi.mock('next/image', () => ({
  default: (props: any) => props,
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(), 
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))