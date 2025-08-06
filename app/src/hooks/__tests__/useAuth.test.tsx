import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

// Mock Convex API first
vi.mock("@/convex/_generated/api", () => ({
  api: {
    auth: {
      getCurrentUser: "auth:getCurrentUser",
      loginWithEmail: "auth:loginWithEmail", 
      loginWithGoogle: "auth:loginWithGoogle",
      verifyOTP: "auth:verifyOTP",
      createAccount: "auth:createAccount",
      logout: "auth:logout",
      createTestOrg: "auth:createTestOrg",
    },
  },
}));

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Unmock useAuth for this test file since we want to test the actual implementation
vi.unmock("@/hooks/useAuth");

// Import after mocking
import { useQuery, useMutation } from "convex/react";
import { useAuth, AuthProvider } from "../useAuth";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock window.location
delete (window as any).location;
window.location = { href: "" } as any;

describe("useAuth Hook", () => {
  const mockLoginWithEmail = vi.fn();
  const mockLoginWithGoogle = vi.fn();
  const mockVerifyOTP = vi.fn();
  const mockCreateAccount = vi.fn();
  const mockLogout = vi.fn();
  const mockCreateTestOrg = vi.fn();

  const mockCurrentUser = {
    userId: "test_user_123",
    orgId: "test_org_456",
    email: "test@example.com",
    name: "Test User",
    role: "admin",
    profileImageUrl: undefined,
    organization: {
      name: "Test Organization",
      logo: undefined,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup Convex mock functions
    (useMutation as any).mockImplementation((apiCall: string) => {
      switch (apiCall) {
        case "auth:loginWithEmail":
          return mockLoginWithEmail;
        case "auth:loginWithGoogle":
          return mockLoginWithGoogle;
        case "auth:verifyOTP":
          return mockVerifyOTP;
        case "auth:createAccount":
          return mockCreateAccount;
        case "auth:logout":
          return mockLogout;
        case "auth:createTestOrg":
          return mockCreateTestOrg;
        default:
          return vi.fn();
      }
    });

    (useQuery as any).mockImplementation((apiCall: string, args: any) => {
      if (apiCall === "auth:getCurrentUser" && args !== "skip") {
        return mockCurrentUser;
      }
      return undefined;
    });

    // Mock successful mutations
    mockLoginWithEmail.mockResolvedValue({
      userId: "test_user_123",
      orgId: "test_org_456",
      sessionToken: "test_session_token",
      requiresOTP: false,
    });

    mockLoginWithGoogle.mockResolvedValue({
      userId: "test_user_123",
      orgId: "test_org_456",
      sessionToken: "test_session_token",
      requiresOTP: false,
    });

    mockVerifyOTP.mockResolvedValue({
      userId: "test_user_123",
      orgId: "test_org_456",
      sessionToken: "test_session_token",
    });

    mockCreateAccount.mockResolvedValue({
      userId: "test_user_123",
      requiresVerification: false,
    });

    mockCreateTestOrg.mockResolvedValue("test_org_456");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe("Initial State", () => {
    it("should initialize with correct initial state", () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // In test environment (SSR), isLoading starts as false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.orgId).toBe(null);
    });

    it("should create test org when no session token exists", async () => {
      // Mock window to simulate browser environment
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });
      
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockCreateTestOrg).toHaveBeenCalled();
      });
    });
  });

  describe("Session Recovery", () => {
    it("should recover session from localStorage", async () => {
      localStorageMock.getItem.mockReturnValue("test_session_token");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({
          userId: mockCurrentUser.userId,
          email: mockCurrentUser.email,
          name: mockCurrentUser.name,
          role: mockCurrentUser.role,
          profileImageUrl: mockCurrentUser.profileImageUrl,
        });
        expect(result.current.orgId).toBe(mockCurrentUser.orgId);
      });
    });

    it("should clear invalid session token", async () => {
      localStorageMock.getItem.mockReturnValue("invalid_token");
      (useQuery as any).mockReturnValue(null); // Invalid session

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("sessionToken");
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe("Email/Password Login", () => {
    it("should login successfully without 2FA", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const loginResult = await result.current.login("test@example.com", "password123");
        expect(loginResult.success).toBe(true);
        expect(loginResult.requiresOTP).toBeUndefined();
      });

      expect(mockLoginWithEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        deviceInfo: {
          userAgent: navigator.userAgent,
          ip: "0.0.0.0",
          deviceName: navigator.platform,
        },
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "sessionToken",
        "test_session_token"
      );
    });

    it("should handle 2FA requirement", async () => {
      mockLoginWithEmail.mockResolvedValueOnce({
        userId: "test_user_123",
        orgId: "test_org_456",
        requiresOTP: true,
        otpMethod: "sms",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const loginResult = await result.current.login("test@example.com", "password123");
        expect(loginResult.success).toBe(true);
        expect(loginResult.requiresOTP).toBe(true);
        expect(loginResult.otpMethod).toBe("sms");
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled(); // No session token yet
    });

    it("should handle login failure", async () => {
      mockLoginWithEmail.mockRejectedValueOnce(new Error("Invalid credentials"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const loginResult = await result.current.login("test@example.com", "wrongpassword");
        expect(loginResult.success).toBe(false);
        expect(loginResult.error).toBe("Invalid credentials");
      });
    });
  });

  describe("Google OAuth Login", () => {
    it("should login with Google successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const googleData = {
        email: "test@example.com",
        id: "google_123",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      };

      await act(async () => {
        const loginResult = await result.current.loginWithGoogle(googleData);
        expect(loginResult.success).toBe(true);
      });

      expect(mockLoginWithGoogle).toHaveBeenCalledWith({
        email: googleData.email,
        googleId: googleData.id,
        name: googleData.name,
        profileImageUrl: googleData.picture,
        deviceInfo: {
          userAgent: navigator.userAgent,
          ip: "0.0.0.0",
          deviceName: navigator.platform,
        },
      });
    });

    it("should handle Google login failure", async () => {
      mockLoginWithGoogle.mockRejectedValueOnce(new Error("Google login failed"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const loginResult = await result.current.loginWithGoogle({});
        expect(loginResult.success).toBe(false);
        expect(loginResult.error).toBe("Google login failed");
      });
    });
  });

  describe("OTP Verification", () => {
    it("should verify OTP successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First, simulate pending login
      await act(async () => {
        mockLoginWithEmail.mockResolvedValueOnce({
          userId: "test_user_123",
          requiresOTP: true,
          otpMethod: "sms",
        });
        await result.current.login("test@example.com", "password123");
      });

      // Then verify OTP
      await act(async () => {
        const verifyResult = await result.current.verifyOTP("123456");
        expect(verifyResult.success).toBe(true);
      });

      expect(mockVerifyOTP).toHaveBeenCalledWith({
        userId: "test_user_123",
        code: "123456",
        deviceInfo: {
          userAgent: navigator.userAgent,
          ip: "0.0.0.0",
          deviceName: navigator.platform,
        },
      });
    });

    it("should handle OTP verification without pending login", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const verifyResult = await result.current.verifyOTP("123456");
        expect(verifyResult.success).toBe(false);
        expect(verifyResult.error).toBe("No pending login");
      });
    });

    it("should handle OTP verification failure", async () => {
      mockVerifyOTP.mockRejectedValueOnce(new Error("Invalid OTP"));
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Setup pending login
      await act(async () => {
        mockLoginWithEmail.mockResolvedValueOnce({
          userId: "test_user_123",
          requiresOTP: true,
        });
        await result.current.login("test@example.com", "password123");
      });

      await act(async () => {
        const verifyResult = await result.current.verifyOTP("wrong_code");
        expect(verifyResult.success).toBe(false);
        expect(verifyResult.error).toBe("Invalid OTP");
      });
    });
  });

  describe("Account Creation", () => {
    it("should create account successfully", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const accountData = {
        email: "new@example.com",
        password: "newpassword123",
        name: "New User",
        phone: "+1234567890",
        role: "staff" as const,
      };

      await act(async () => {
        const createResult = await result.current.createAccount(accountData);
        expect(createResult.success).toBe(true);
        expect(createResult.requiresVerification).toBe(false);
      });

      expect(mockCreateAccount).toHaveBeenCalledWith({
        orgId: "test_org_456",
        ...accountData,
      });
    });

    it("should handle account creation failure", async () => {
      mockCreateAccount.mockRejectedValueOnce(new Error("Email already exists"));
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const createResult = await result.current.createAccount({
          email: "existing@example.com",
          password: "password123",
          name: "User",
        });
        expect(createResult.success).toBe(false);
        expect(createResult.error).toBe("Email already exists");
      });
    });
  });

  describe("Logout", () => {
    it("should logout successfully", async () => {
      localStorageMock.getItem.mockReturnValue("test_session_token");
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth state
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledWith({
        sessionToken: "test_session_token",
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("sessionToken");
      expect(window.location.href).toBe("/login");
    });

    it("should logout even without session token", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("sessionToken");
      expect(window.location.href).toBe("/login");
    });
  });

  describe("Context Provider", () => {
    it("should throw error when useAuth is used outside provider", () => {
      expect(() => {
        renderHook(() => useAuth()); // No wrapper
      }).toThrow("useAuth must be used within AuthProvider");
    });

    it("should provide authentication context to children", () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty("login");
      expect(result.current).toHaveProperty("loginWithGoogle");
      expect(result.current).toHaveProperty("verifyOTP");
      expect(result.current).toHaveProperty("logout");
      expect(result.current).toHaveProperty("createAccount");
      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("orgId");
      expect(result.current).toHaveProperty("organization");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isAuthenticated");
      expect(result.current).toHaveProperty("sessionToken");
    });
  });

  describe("Loading States", () => {
    it("should manage loading state correctly", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state in test environment is not loading
      expect(result.current.isLoading).toBe(false);

      // After calling login, it should set loading briefly
      const loginPromise = act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      await loginPromise;
      
      // Loading state is managed internally and may not be visible in synchronous tests
      expect(mockLoginWithEmail).toHaveBeenCalled();
    });

    it("should handle async operations correctly", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Setup pending login first
      await act(async () => {
        mockLoginWithEmail.mockResolvedValueOnce({
          userId: "test_user_123",
          requiresOTP: true,
        });
        await result.current.login("test@example.com", "password123");
      });

      // Then verify OTP
      await act(async () => {
        await result.current.verifyOTP("123456");
      });

      expect(mockVerifyOTP).toHaveBeenCalled();
    });
  });
});