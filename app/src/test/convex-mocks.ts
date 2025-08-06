import { vi } from 'vitest'

// Mock Convex hooks
export const mockConvexHooks = () => {
  vi.mock('convex/react', () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useAction: vi.fn(),
    ConvexProvider: ({ children }: any) => children,
    ConvexReactClient: vi.fn().mockImplementation(() => ({
      mutation: vi.fn(),
      query: vi.fn(),
      action: vi.fn(),
    })),
  }))
}

// Mock auth hooks
export const mockAuthHooks = () => {
  vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(() => ({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    })),
  }))
}

// Mock API responses
export const createMockApiResponse = (data: any) => {
  return {
    data,
    loading: false,
    error: null,
  }
}

// Mock Convex functions
export const mockConvexFunctions = {
  // Mock queries
  mockQuery: (data: any) => {
    const useQuery = vi.fn(() => data)
    return useQuery
  },
  
  // Mock mutations
  mockMutation: (implementation?: Function) => {
    const useMutation = vi.fn(() => implementation || vi.fn())
    return useMutation
  },
  
  // Mock actions  
  mockAction: (implementation?: Function) => {
    const useAction = vi.fn(() => implementation || vi.fn())
    return useAction
  },
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  _creationTime: Date.now(),
  orgId: 'org_123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin' as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})

export const createMockOrg = (overrides = {}) => ({
  _id: 'org_123',
  _creationTime: Date.now(),
  name: 'Test Organization',
  logo: null,
  domain: 'test.com',
  qrKey: 'test-qr-key',
  limits: {
    clients: 1000,
    storage_gb: 10,
    messages_per_month: 5000,
  },
  theme: {
    themeId: 'default',
    appliedAt: Date.now(),
    fontFamily: 'Inter',
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})

export const createMockClient = (overrides = {}) => ({
  _id: 'client_123',
  _creationTime: Date.now(),
  orgId: 'org_123',
  fullName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  gender: 'male' as const,
  dateOfBirth: '1990-01-01',
  email: 'john@example.com',
  phones: ['+1234567890'],
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
  },
  clientPortalStatus: 'active' as const,
  tags: ['new', 'premium'],
  visited: false,
  fired: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})

export const createMockWorkflow = (overrides = {}) => ({
  _id: 'workflow_123',
  _creationTime: Date.now(),
  orgId: 'org_123',
  name: 'Test Workflow',
  description: 'A test workflow',
  status: 'active' as const,
  trigger: 'new_client' as const,
  preventDuplicates: true,
  duplicatePreventionDays: 30,  
  conditions: [],
  actions: [
    {
      type: 'send_sms',
      config: { message: 'Welcome!' },
      order: 1,
    },
  ],
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})

export const createMockAppointment = (overrides = {}) => ({
  _id: 'appointment_123',
  _creationTime: Date.now(),
  orgId: 'org_123',
  clientId: 'client_123',
  dateTime: Date.now() + 86400000, // Tomorrow
  type: 'consultation',
  provider: 'Dr. Smith',
  notes: 'Initial consultation',
  status: 'scheduled' as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})