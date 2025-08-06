import { vi } from "vitest";

// Mock organization data
export const TEST_ORG_ID = "test_org_123456789";
export const TEST_USER_ID = "test_user_123456789";

export const mockOrganization = {
  _id: TEST_ORG_ID,
  name: "Test Aesthetics Clinic",
  domain: "test.aesthetics.local",
  limits: {
    clients: 1000,
    storage_gb: 10,
    messages_per_month: 5000,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockUser = {
  userId: TEST_USER_ID,
  orgId: TEST_ORG_ID,
  email: "admin@test.local",
  name: "Test Admin",
  role: "admin" as const,
  profileImageUrl: undefined,
};

export const mockAuthState = {
  user: mockUser,
  orgId: TEST_ORG_ID,
  organization: {
    name: mockOrganization.name,
    logo: undefined,
  },
  isLoading: false,
  isAuthenticated: true,
  sessionToken: "test_session_token",
};

// Mock auth functions
export const mockAuthFunctions = {
  login: vi.fn().mockResolvedValue({ success: true }),
  loginWithGoogle: vi.fn().mockResolvedValue({ success: true }),
  verifyOTP: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn(),
  createAccount: vi.fn().mockResolvedValue({ success: true }),
};

// Complete mock auth hook return value
export const mockAuthHook = {
  ...mockAuthState,
  ...mockAuthFunctions,
};

// Helper to mock useAuth hook in tests
export function mockUseAuth(customValues: Partial<typeof mockAuthHook> = {}) {
  return {
    ...mockAuthHook,
    ...customValues,
  };
}

// Test utilities for Convex integration
export const testConvexIds = {
  orgId: TEST_ORG_ID,
  userId: TEST_USER_ID,
  workflowId: "test_workflow_123456789",
  clientId: "test_client_123456789",
  appointmentId: "test_appointment_123456789",
};

// Mock Convex queries/mutations for testing
export const mockConvexData = {
  organizations: [mockOrganization],
  users: [
    {
      _id: TEST_USER_ID,
      orgId: TEST_ORG_ID,
      email: "admin@test.local",
      name: "Test Admin",
      role: "admin",
      twoFactorEnabled: false,
      preferredOtpMethod: "email",
      isActive: true,
      emailVerified: true,
      phoneVerified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  workflows: [
    {
      _id: testConvexIds.workflowId,
      orgId: TEST_ORG_ID,
      name: "Test Workflow",
      description: "Test workflow description",
      status: "active",
      trigger: "new_client",
      preventDuplicates: true,
      duplicatePreventionDays: 30,
      conditions: [],
      actions: [],
      blocks: [],
      connections: [],
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  clients: [
    {
      _id: testConvexIds.clientId,
      orgId: TEST_ORG_ID,
      fullName: "Test Client",
      firstName: "Test",
      lastName: "Client",
      email: "test.client@example.com",
      phones: ["+1234567890"],
      gender: "other" as const,
      clientPortalStatus: "active" as const,
      tags: ["test"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  appointments: [
    {
      _id: testConvexIds.appointmentId,
      orgId: TEST_ORG_ID,
      clientId: testConvexIds.clientId,
      dateTime: Date.now() + (24 * 60 * 60 * 1000), // Tomorrow
      type: "Consultation",
      provider: "Dr. Test",
      status: "scheduled" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
};