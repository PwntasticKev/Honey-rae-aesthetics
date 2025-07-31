import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Get the client data from Convex
    const csvData = await convex.query(api.clients.exportSingleClient, {
      clientId: clientId as any,
    });

    // Return the CSV data
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="client-${clientId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export client error:", error);
    return NextResponse.json(
      { error: "Failed to export client data" },
      { status: 500 },
    );
  }
}
