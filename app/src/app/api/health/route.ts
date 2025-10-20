import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Health check data
    const healthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "unknown",
      uptime: process.uptime(),
      checks: {
        database: "unknown",
        memory: "unknown",
        disk: "unknown"
      }
    };

    // Test database connection
    try {
      // Simple query to test DB connectivity
      await db.execute("SELECT 1");
      healthCheck.checks.database = "healthy";
    } catch (error) {
      healthCheck.checks.database = "unhealthy";
      healthCheck.status = "degraded";
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // Memory health assessment (flag if heap usage > 1GB)
    if (memoryUsageMB.heapUsed > 1024) {
      healthCheck.checks.memory = "warning";
      healthCheck.status = "degraded";
    } else {
      healthCheck.checks.memory = "healthy";
    }

    // Response time
    const responseTime = Date.now() - startTime;
    
    // Return appropriate status code
    const statusCode = healthCheck.status === "healthy" ? 200 : 
                      healthCheck.status === "degraded" ? 200 : 503;

    return NextResponse.json({
      ...healthCheck,
      responseTime: `${responseTime}ms`,
      memory: memoryUsageMB
    }, { status: statusCode });

  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      environment: process.env.NODE_ENV
    }, { status: 503 });
  }
}