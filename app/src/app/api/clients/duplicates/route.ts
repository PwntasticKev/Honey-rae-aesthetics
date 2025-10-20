import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, potentialDuplicates } from "@/db/schema";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import {
  findClientMatches,
  getBestMatch,
  needsManualReview,
  type SmartMatchingOptions,
} from "@/lib/smart-matching";

// Schema for checking duplicates
const checkDuplicatesSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  threshold: z.number().min(0).max(100).default(60),
});

// Schema for resolving duplicates
const resolveDuplicateSchema = z.object({
  duplicateId: z.number().positive(),
  resolution: z.enum(["merged", "not_duplicate", "ignored"]),
  mergeToClientId: z.number().positive().optional(), // Required if resolution is "merged"
});

// GET /api/clients/duplicates - Get pending duplicate reviews
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where condition based on status
    let whereCondition = eq(potentialDuplicates.clientId, 
      // Get client IDs for this org by joining with clients table
      sql`(SELECT id FROM ${clients} WHERE org_id = ${session.user.orgId})`
    );

    if (status === 'pending') {
      whereCondition = and(whereCondition, isNull(potentialDuplicates.resolvedAt));
    } else if (status === 'resolved') {
      whereCondition = and(whereCondition, sql`${potentialDuplicates.resolvedAt} IS NOT NULL`);
    }

    // Get potential duplicates with client details
    const duplicatesWithDetails = await db
      .select({
        duplicate: potentialDuplicates,
        client: {
          id: clients.id,
          fullName: clients.fullName,
          email: clients.email,
          phones: clients.phones,
          createdAt: clients.createdAt,
        },
        suspectedClient: {
          id: sql`suspected.id`,
          fullName: sql`suspected.full_name`,
          email: sql`suspected.email`,
          phones: sql`suspected.phones`,
          createdAt: sql`suspected.created_at`,
        },
      })
      .from(potentialDuplicates)
      .leftJoin(clients, eq(potentialDuplicates.clientId, clients.id))
      .leftJoin(
        sql`${clients} AS suspected`,
        sql`${potentialDuplicates.suspectedDuplicateId} = suspected.id`
      )
      .where(whereCondition)
      .orderBy(desc(potentialDuplicates.createdAt))
      .limit(Math.min(limit, 100));

    const formattedDuplicates = duplicatesWithDetails.map(item => ({
      id: item.duplicate.id,
      matchType: item.duplicate.matchType,
      confidence: item.duplicate.confidence,
      matchingFields: item.duplicate.matchingFields,
      client1: item.client,
      client2: item.suspectedClient,
      resolution: item.duplicate.resolution,
      resolvedAt: item.duplicate.resolvedAt,
      resolvedBy: item.duplicate.resolvedBy,
      createdAt: item.duplicate.createdAt,
    }));

    return NextResponse.json({
      duplicates: formattedDuplicates,
      status,
      total: formattedDuplicates.length,
    });

  } catch (error) {
    console.error("Error fetching potential duplicates:", error);
    return NextResponse.json(
      { error: "Failed to fetch potential duplicates" },
      { status: 500 }
    );
  }
}

// POST /api/clients/duplicates/check - Check for duplicates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = checkDuplicatesSchema.parse(body);

    // Perform smart matching
    const matchingOptions: SmartMatchingOptions = {
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      dateOfBirth: validatedData.dateOfBirth,
      threshold: validatedData.threshold,
      createDuplicateRecord: false, // We'll handle this manually
    };

    const matches = await findClientMatches(session.user.orgId, matchingOptions);

    // Determine action needed
    const bestMatch = getBestMatch(matches);
    const manualReviewNeeded = needsManualReview(matches);

    let recommendation: string;
    if (bestMatch) {
      recommendation = "auto_match";
    } else if (manualReviewNeeded) {
      recommendation = "manual_review";
    } else {
      recommendation = "create_new";
    }

    return NextResponse.json({
      matches,
      bestMatch,
      recommendation,
      manualReviewNeeded,
      totalMatches: matches.length,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error checking for duplicates:", error);
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/duplicates/resolve - Resolve duplicate
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = resolveDuplicateSchema.parse(body);

    // Verify duplicate exists and belongs to this org
    const duplicateRecord = await db
      .select({
        duplicate: potentialDuplicates,
        client: clients,
      })
      .from(potentialDuplicates)
      .leftJoin(clients, eq(potentialDuplicates.clientId, clients.id))
      .where(
        and(
          eq(potentialDuplicates.id, validatedData.duplicateId),
          eq(clients.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (duplicateRecord.length === 0) {
      return NextResponse.json(
        { error: "Duplicate record not found" },
        { status: 404 }
      );
    }

    const duplicate = duplicateRecord[0];

    // Check if already resolved
    if (duplicate.duplicate.resolvedAt) {
      return NextResponse.json(
        { error: "Duplicate already resolved" },
        { status: 409 }
      );
    }

    // Handle merge resolution
    if (validatedData.resolution === "merged") {
      if (!validatedData.mergeToClientId) {
        return NextResponse.json(
          { error: "mergeToClientId is required for merge resolution" },
          { status: 400 }
        );
      }

      // Verify merge target exists and belongs to this org
      const targetClient = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, validatedData.mergeToClientId),
            eq(clients.orgId, session.user.orgId)
          )
        )
        .limit(1);

      if (targetClient.length === 0) {
        return NextResponse.json(
          { error: "Target client not found" },
          { status: 404 }
        );
      }

      // TODO: Implement actual client merge logic
      // This would involve:
      // 1. Moving appointments to target client
      // 2. Merging contact information
      // 3. Combining notes and history
      // 4. Updating workflow enrollments
      // 5. Deleting the duplicate client
      
      console.log(`Would merge client ${duplicate.duplicate.clientId} into ${validatedData.mergeToClientId}`);
    }

    // Update duplicate record as resolved
    await db
      .update(potentialDuplicates)
      .set({
        resolution: validatedData.resolution,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      })
      .where(eq(potentialDuplicates.id, validatedData.duplicateId));

    return NextResponse.json({
      message: "Duplicate resolved successfully",
      resolution: validatedData.resolution,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error resolving duplicate:", error);
    return NextResponse.json(
      { error: "Failed to resolve duplicate" },
      { status: 500 }
    );
  }
}

// Helper function to record a potential duplicate
export async function recordPotentialDuplicate(
  clientId: number,
  suspectedDuplicateId: number,
  matchType: 'email' | 'phone' | 'name' | 'combined',
  confidence: number,
  matchingFields: any
): Promise<void> {
  try {
    await db.insert(potentialDuplicates).values({
      clientId,
      suspectedDuplicateId,
      matchType,
      confidence,
      matchingFields,
    });
  } catch (error) {
    console.error("Error recording potential duplicate:", error);
    // Don't throw to avoid interrupting the main process
  }
}