export const mockUser = {
  _id: "user_test_123",
  email: "test@honeyrae.com",
  name: "Test User",
  orgId: "org_test_456",
  role: "admin",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockOrg = {
  _id: "org_test_456",
  name: "Test Aesthetics Clinic",
  domain: "test.honeyrae.com",
  logo: "https://example.com/logo.png",
  limits: {
    clients: 1000,
    storage_gb: 10,
    messages_per_month: 5000,
  },
  theme: {
    themeId: "ocean",
    fontFamily: "Inter",
    appliedAt: Date.now(),
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockClient = {
  _id: "client_test_789",
  orgId: "org_test_456",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  phone: "+1234567890",
  dateOfBirth: "1990-01-01",
  gender: "female",
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    zip: "12345",
    country: "US",
  },
  membershipType: "premium",
  referralSource: "google",
  portalStatus: "active",
  tags: ["new-client", "botox-interested"],
  notes: "Interested in Botox treatment",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockAppointment = {
  _id: "appt_test_101",
  orgId: "org_test_456",
  clientId: "client_test_789",
  providerId: "provider_test_202",
  title: "Botox Consultation",
  description: "Initial consultation for Botox treatment",
  startTime: Date.now() + 86400000, // Tomorrow
  endTime: Date.now() + 86400000 + 3600000, // Tomorrow + 1 hour
  status: "scheduled",
  type: "consultation",
  location: "Main Office",
  googleEventId: "google_event_123",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockProvider = {
  _id: "provider_test_202",
  orgId: "org_test_456",
  name: "Dr. Smith",
  email: "dr.smith@test.com",
  color: "#4F46E5",
  googleCalendarId: "dr.smith@test.com",
  accessToken: "mock_access_token",
  refreshToken: "mock_refresh_token",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockWorkflow = {
  _id: "workflow_test_303",
  orgId: "org_test_456",
  name: "Welcome New Client",
  description: "Automated welcome sequence for new clients",
  isActive: true,
  trigger: {
    type: "client_created",
    conditions: [],
  },
  actions: [
    {
      type: "send_email",
      delay: 0,
      template: "welcome_email",
      data: {
        subject: "Welcome to our clinic!",
        body: "Thank you for choosing us for your aesthetic needs.",
      },
    },
    {
      type: "send_sms",
      delay: 86400000, // 1 day
      template: "followup_sms",
      data: {
        message: "How was your first visit? We'd love to hear from you!",
      },
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockMessageTemplate = {
  _id: "template_test_404",
  orgId: "org_test_456",
  name: "Appointment Reminder",
  type: "sms",
  subject: "Appointment Reminder",
  body: "Hi {{firstName}}, this is a reminder about your {{treatmentType}} appointment tomorrow at {{time}}.",
  variables: ["firstName", "treatmentType", "time"],
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockFile = {
  _id: "file_test_505",
  orgId: "org_test_456",
  clientId: "client_test_789",
  fileName: "before_botox.jpg",
  fileUrl: "https://s3.example.com/before_botox.jpg",
  fileSize: 1024000, // 1MB
  mimeType: "image/jpeg",
  tags: ["before", "botox", "consultation"],
  sessionId: "session_test_606",
  altText: "Before photo for Botox treatment",
  uploadedBy: "user_test_123",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const mockThemes = [
  {
    id: "default",
    name: "Default",
    colors: {
      primary: "oklch(0.65 0.15 350)",
      background: "oklch(0.99 0.005 300)",
      foreground: "oklch(0.15 0.02 300)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      primary: "oklch(0.6 0.2 240)",
      background: "oklch(0.98 0.01 240)",
      foreground: "oklch(0.2 0.02 240)",
    },
  },
];

export const mockFonts = [
  { id: "inter", name: "Inter", value: "Inter" },
  { id: "poppins", name: "Poppins", value: "Poppins" },
  { id: "roboto", name: "Roboto", value: "Roboto" },
];

// Helper functions for creating test data
export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
});

export const createMockOrg = (overrides: Partial<typeof mockOrg> = {}) => ({
  ...mockOrg,
  ...overrides,
});

export const createMockClient = (
  overrides: Partial<typeof mockClient> = {},
) => ({
  ...mockClient,
  ...overrides,
});

export const createMockAppointment = (
  overrides: Partial<typeof mockAppointment> = {},
) => ({
  ...mockAppointment,
  ...overrides,
});

// Test data sets for different scenarios
export const testScenarios = {
  newUser: {
    user: createMockUser({ role: "staff" }),
    org: createMockOrg({ name: "New Clinic" }),
    clients: [],
  },
  establishedClinic: {
    user: mockUser,
    org: mockOrg,
    clients: [
      mockClient,
      createMockClient({
        _id: "client_test_790",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
      }),
    ],
    appointments: [mockAppointment],
    providers: [mockProvider],
  },
};
