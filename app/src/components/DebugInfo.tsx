"use client";

// Temporarily disabled Convex
// import { useQuery } from "convex/react";
// import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export function DebugInfo() {
  const { user: authUser } = useAuth();
  // Temporarily disabled Convex queries
  const userData = null;
  const orgs: any[] = [];
  const orgId = null;
  const clients: any[] = [];
  const dbStats = null;

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
      <div className="text-sm text-yellow-700">
        <p>
          <strong>Total Organizations:</strong> {orgs?.length || 0}
        </p>
        <p>
          <strong>User Email:</strong> {authUser?.email || "Not logged in"}
        </p>
        <p>
          <strong>User Found:</strong> {userData ? "Yes" : "No"}
        </p>
        <p>
          <strong>User Organization:</strong> {userData?.orgId || "Not found"}
        </p>
        <p>
          <strong>Using Org ID:</strong> {orgId || "None"}
        </p>
        <p>
          <strong>Clients in User's Org:</strong> {clients?.length || 0}
        </p>
        <p>
          <strong>First Client ID:</strong> {clients?.[0]?._id || "None"}
        </p>
        <p>
          <strong>First Client Name:</strong> {clients?.[0]?.fullName || "None"}
        </p>
        <p>
          <strong>Query Status:</strong>{" "}
          {clients === undefined
            ? "Loading"
            : clients === null
              ? "Error"
              : "Loaded"}
        </p>

        {/* Database Stats */}
        {dbStats && (
          <>
            <hr className="my-2 border-yellow-300" />
            <p>
              <strong>Database Stats:</strong>
            </p>
            <p>
              Orgs: {dbStats.orgs} | Users: {dbStats.users} | Clients:{" "}
              {dbStats.clients}
            </p>
            <p>
              Appointments: {dbStats.appointments} | Templates:{" "}
              {dbStats.messageTemplates}
            </p>
            {dbStats.sampleData.clients.length > 0 && (
              <p>
                <strong>Sample Client:</strong>{" "}
                {dbStats.sampleData.clients[0].name} (Org:{" "}
                {dbStats.sampleData.clients[0].orgId})
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
