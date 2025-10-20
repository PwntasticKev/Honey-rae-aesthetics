import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint without authentication
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    status: "success"
  });
}