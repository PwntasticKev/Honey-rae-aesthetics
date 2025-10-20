import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function GET() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'honeyrae',
      password: 'honeyrae',
      database: 'honey_rae'
    });
    
    const [rows] = await connection.execute("SELECT 1 as test");
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      testResult: rows,
      databaseUrl: process.env.DATABASE_URL?.replace(/password:[^@]*@/, "password:***@")
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      databaseUrl: process.env.DATABASE_URL?.replace(/password:[^@]*@/, "password:***@")
    }, { status: 500 });
  }
}