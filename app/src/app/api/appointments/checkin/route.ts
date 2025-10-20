import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  appointments,
  appointmentCheckins,
  clients,
  users,
  workflowTriggers,
  workflowEnrollments,
} from "@/db/schema";
import { eq, and, gte, lte, desc, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { triggerAppointmentWorkflow } from "@/lib/workflow-triggers";

// Schema for check-in creation/update
const checkinSchema = z.object({
  appointmentId: z.number().positive(),
  status: z.enum(["scheduled", "shown", "no_show", "late", "rescheduled", "cancelled"]),
  notes: z.string().optional(),
  phoneNumberAdded: z.string().optional(),
});

// Schema for fetching check-in list
const checkinListSchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD format
  status: z.string().optional(),
  providerId: z.number().optional(),
});

// GET /api/appointments/checkin - Get appointments for check-in
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');

    // Parse date for start and end of day
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    // Build query conditions
    let whereConditions = and(
      eq(appointments.orgId, session.user.orgId),
      gte(appointments.dateTime, startOfDay),
      lte(appointments.dateTime, endOfDay)
    );

    if (providerId) {
      whereConditions = and(whereConditions, eq(appointments.providerId, parseInt(providerId)));
    }

    // Get appointments with client and provider info
    const appointmentsWithDetails = await db
      .select({
        appointment: appointments,
        client: clients,
        provider: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        checkin: appointmentCheckins,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(users, eq(appointments.providerId, users.id))
      .leftJoin(appointmentCheckins, eq(appointments.id, appointmentCheckins.appointmentId))
      .where(whereConditions)
      .orderBy(appointments.dateTime);

    // Filter by check-in status if specified
    let filteredAppointments = appointmentsWithDetails;
    if (status) {
      filteredAppointments = appointmentsWithDetails.filter(item => {
        const checkinStatus = item.checkin?.status || 'scheduled';
        return checkinStatus === status;
      });
    }

    // Format response
    const appointmentsList = filteredAppointments.map(item => ({
      id: item.appointment.id,
      clientName: item.client?.fullName || 'Unknown Client',
      clientEmail: item.client?.email,
      clientPhones: item.client?.phones || [],
      providerName: item.provider?.name || 'Unknown Provider',
      service: item.appointment.service,
      dateTime: item.appointment.dateTime,
      duration: item.appointment.duration,
      appointmentStatus: item.appointment.status,
      checkinStatus: item.checkin?.status || 'scheduled',
      checkinNotes: item.checkin?.notes,
      checkedInAt: item.checkin?.checkedInAt,
      checkedInBy: item.checkin?.checkedInBy,
      phoneNumberAdded: item.checkin?.phoneNumberAdded,
      canCheckIn: !item.checkin || item.checkin.status === 'scheduled',
    }));

    return NextResponse.json({
      appointments: appointmentsList,
      date,
      total: appointmentsList.length,
    });

  } catch (error) {
    console.error("Error fetching check-in list:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments for check-in" },
      { status: 500 }
    );
  }
}

// POST /api/appointments/checkin - Create or update check-in status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = checkinSchema.parse(body);

    // Verify appointment belongs to this org
    const appointment = await db
      .select({
        id: appointments.id,
        orgId: appointments.orgId,
        clientId: appointments.clientId,
        service: appointments.service,
        dateTime: appointments.dateTime,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, validatedData.appointmentId),
          eq(appointments.orgId, session.user.orgId)
        )
      )
      .limit(1);

    if (appointment.length === 0) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    const appointmentData = appointment[0];

    // Check if check-in already exists
    const existingCheckin = await db
      .select()
      .from(appointmentCheckins)
      .where(eq(appointmentCheckins.appointmentId, validatedData.appointmentId))
      .limit(1);

    let checkinId: number;

    if (existingCheckin.length > 0) {
      // Update existing check-in
      await db
        .update(appointmentCheckins)
        .set({
          status: validatedData.status,
          notes: validatedData.notes,
          phoneNumberAdded: validatedData.phoneNumberAdded,
          checkedInBy: session.user.id,
          checkedInAt: new Date(),
        })
        .where(eq(appointmentCheckins.id, existingCheckin[0].id));
      
      checkinId = existingCheckin[0].id;
    } else {
      // Create new check-in
      const result = await db.insert(appointmentCheckins).values({
        appointmentId: validatedData.appointmentId,
        status: validatedData.status,
        notes: validatedData.notes,
        phoneNumberAdded: validatedData.phoneNumberAdded,
        checkedInBy: session.user.id,
      });
      
      checkinId = result.insertId;
    }

    // If phone number was added, update client record
    if (validatedData.phoneNumberAdded) {
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, appointmentData.clientId))
        .limit(1);

      if (client.length > 0) {
        const currentPhones = client[0].phones || [];
        if (!currentPhones.includes(validatedData.phoneNumberAdded)) {
          await db
            .update(clients)
            .set({
              phones: [...currentPhones, validatedData.phoneNumberAdded],
            })
            .where(eq(clients.id, appointmentData.clientId));
        }
      }
    }

    // Trigger enhanced workflows based on check-in status
    if (validatedData.status === 'shown' || 
        validatedData.status === 'no_show' || 
        validatedData.status === 'late') {
      
      // Map check-in status to workflow trigger types
      let triggerType: 'completed' | 'no_show' | 'rescheduled' | 'cancelled' | 'scheduled' = 'completed';
      switch (validatedData.status) {
        case 'shown':
          triggerType = 'completed';
          break;
        case 'no_show':
          triggerType = 'no_show';
          break;
        case 'late':
          triggerType = 'completed'; // Treat late as completed
          break;
      }

      // Use enhanced workflow trigger system
      await triggerAppointmentWorkflow(
        session.user.orgId,
        appointmentData.id,
        triggerType,
        {
          checkinStatus: validatedData.status,
          checkinNotes: validatedData.notes,
          checkedInBy: session.user.id,
          phoneNumberAdded: validatedData.phoneNumberAdded,
        }
      );
    }

    return NextResponse.json({
      message: "Check-in processed successfully",
      checkinId,
      triggeredWorkflows: true, // TODO: Return actual workflow trigger results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error processing check-in:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}

// Helper function to trigger workflows based on appointment status
async function triggerWorkflows(
  appointment: any,
  checkinStatus: string,
  orgId: number
) {
  try {
    // Map check-in status to trigger types
    let triggerType: string;
    switch (checkinStatus) {
      case 'shown':
        triggerType = 'appointment_completed';
        break;
      case 'no_show':
        triggerType = 'appointment_no_show';
        break;
      case 'late':
        triggerType = 'appointment_late';
        break;
      default:
        return; // No workflow trigger for this status
    }

    // Find active workflows with matching triggers
    const matchingTriggers = await db
      .select({
        workflowId: workflowTriggers.workflowId,
        conditions: workflowTriggers.conditions,
        priority: workflowTriggers.priority,
      })
      .from(workflowTriggers)
      .where(
        and(
          eq(workflowTriggers.triggerType, triggerType as any),
          eq(workflowTriggers.isActive, true)
        )
      )
      .orderBy(workflowTriggers.priority);

    for (const trigger of matchingTriggers) {
      // Check if conditions match
      if (await evaluateTriggerConditions(trigger.conditions, appointment)) {
        // Cancel any existing active enrollments for this workflow
        await db
          .update(workflowEnrollments)
          .set({
            currentStatus: 'cancelled',
            completedAt: new Date(),
          })
          .where(
            and(
              eq(workflowEnrollments.workflowId, trigger.workflowId),
              eq(workflowEnrollments.clientId, appointment.clientId),
              eq(workflowEnrollments.currentStatus, 'active')
            )
          );

        // Enroll client in workflow
        await db.insert(workflowEnrollments).values({
          orgId,
          workflowId: trigger.workflowId,
          clientId: appointment.clientId,
          enrollmentReason: `${triggerType}: ${appointment.service}`,
          currentStatus: 'active',
          currentStep: 'start',
          metadata: {
            appointmentId: appointment.id,
            checkinStatus,
            appointmentService: appointment.service,
            appointmentDateTime: appointment.dateTime,
          },
        });

        console.log(`Enrolled client ${appointment.clientId} in workflow ${trigger.workflowId}`);
      }
    }

  } catch (error) {
    console.error("Error triggering workflows:", error);
    // Don't throw here as check-in should still succeed even if workflow trigger fails
  }
}

// Helper function to evaluate trigger conditions
async function evaluateTriggerConditions(conditions: any, appointment: any): Promise<boolean> {
  if (!conditions) return true; // No conditions means always trigger

  try {
    // Check appointment type condition
    if (conditions.appointmentType && Array.isArray(conditions.appointmentType)) {
      if (!conditions.appointmentType.includes(appointment.service)) {
        return false;
      }
    }

    // TODO: Add more condition evaluations:
    // - Client tags
    // - Days since last visit
    // - Visit count
    // - Age range
    // - Custom fields

    return true;
  } catch (error) {
    console.error("Error evaluating trigger conditions:", error);
    return false; // Fail safe - don't trigger on condition evaluation errors
  }
}