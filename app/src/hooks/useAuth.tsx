import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth(requireAuth: boolean = true) {
  const authContext = useAuthContext();
  const router = useRouter();
  
  useEffect(() => {
    if (requireAuth && !authContext.isLoading && !authContext.isAuthenticated) {
      router.push("/login");
    }
  }, [requireAuth, authContext.isLoading, authContext.isAuthenticated, router]);

  return {
    user: authContext.user,
    isLoading: authContext.isLoading,
    isAuthenticated: authContext.isAuthenticated,
    isMasterOwner: authContext.user?.isMasterOwner || false,
    orgId: authContext.user?.orgId,
    role: authContext.user?.role,
    error: authContext.error,
    login: authContext.login,
    logout: authContext.logout,
    clearError: authContext.clearError,
  };
}

export function useRequireAuth() {
  return useAuth(true);
}

export function useMasterOwner() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !user?.isMasterOwner) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user?.isMasterOwner, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isMasterOwner: user?.isMasterOwner || false,
  };
}