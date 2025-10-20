// Enhanced workflow trigger system
import { db } from "@/lib/db";
import { 
  workflowTriggers, 
  workflowEnrollments, 
  appointments, 
  clients, 
  workflows 
} from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

// Trigger types and their configuration
export interface TriggerConfig {
  type: 'appointment_scheduled' | 'appointment_completed' | 'appointment_no_show' | 
        'client_created' | 'recurring_reminder' | 'birthday_reminder' | 
        'follow_up_reminder' | 'pre_appointment' | 'post_appointment';
  conditions?: {
    appointmentTypes?: string[];
    clientTags?: string[];
    daysBefore?: number;
    daysAfter?: number;
    timeOfDay?: string;
    recurringInterval?: 'daily' | 'weekly' | 'monthly';
  };
  actions: WorkflowAction[];
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'create_task' | 'schedule_follow_up' | 'add_tag' | 'update_status';
  templateId?: number;
  delay?: number; // Minutes to delay action
  conditions?: {
    clientPreferences?: string[];
    previousResponse?: string;
  };
}

export interface TriggerContext {
  orgId: number;
  clientId?: number;
  appointmentId?: number;
  userId?: number;
  triggerData: Record<string, any>;
}

// Enhanced workflow trigger engine
export class WorkflowTriggerEngine {
  // Process appointment-related triggers
  async processAppointmentTrigger(
    orgId: number,
    appointmentId: number,
    triggerType: 'scheduled' | 'completed' | 'no_show' | 'rescheduled' | 'cancelled',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      console.log(`Processing appointment trigger: ${triggerType} for appointment ${appointmentId}`);

      // Get appointment details with client info
      const appointmentDetails = await db
        .select({
          appointment: appointments,
          client: clients,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.orgId, orgId)
          )
        )
        .limit(1);

      if (appointmentDetails.length === 0) {
        console.error('Appointment not found:', appointmentId);
        return;
      }

      const { appointment, client } = appointmentDetails[0];
      if (!client) {
        console.error('Client not found for appointment:', appointmentId);
        return;
      }

      // Find applicable workflow triggers
      const triggerMappings: Record<string, string> = {
        'scheduled': 'appointment_scheduled',
        'completed': 'appointment_completed',
        'no_show': 'appointment_no_show',
        'rescheduled': 'appointment_scheduled', // Treat as new scheduled
        'cancelled': 'appointment_cancelled',
      };

      const mappedTriggerType = triggerMappings[triggerType];
      if (!mappedTriggerType) {
        console.error('Unknown trigger type:', triggerType);
        return;
      }

      // Get all active workflow triggers for this org and trigger type
      const triggers = await db
        .select()
        .from(workflowTriggers)
        .where(
          and(
            eq(workflowTriggers.orgId, orgId),
            eq(workflowTriggers.triggerType, mappedTriggerType),
            eq(workflowTriggers.isActive, true)
          )
        )
        .orderBy(desc(workflowTriggers.priority));

      console.log(`Found ${triggers.length} applicable triggers for ${mappedTriggerType}`);

      // Process each trigger
      for (const trigger of triggers) {
        try {
          const shouldExecute = await this.evaluateTriggerConditions(
            trigger,
            {
              orgId,
              clientId: client.id,
              appointmentId: appointment.id,
              triggerData: {
                appointment,
                client,
                triggerType,
                ...metadata,
              },
            }
          );

          if (shouldExecute) {
            await this.executeTrigger(trigger, {
              orgId,
              clientId: client.id,
              appointmentId: appointment.id,
              triggerData: {
                appointment,
                client,
                triggerType,
                ...metadata,
              },
            });
          }
        } catch (error) {
          console.error(`Error processing trigger ${trigger.id}:`, error);
          // Continue with other triggers
        }
      }

    } catch (error) {
      console.error('Error in processAppointmentTrigger:', error);
      throw error;
    }
  }

  // Process client-related triggers
  async processClientTrigger(
    orgId: number,
    clientId: number,
    triggerType: 'created' | 'updated' | 'birthday' | 'anniversary',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      console.log(`Processing client trigger: ${triggerType} for client ${clientId}`);

      // Get client details
      const clientDetails = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, clientId),
            eq(clients.orgId, orgId)
          )
        )
        .limit(1);

      if (clientDetails.length === 0) {
        console.error('Client not found:', clientId);
        return;
      }

      const client = clientDetails[0];

      // Map trigger types
      const triggerMappings: Record<string, string> = {
        'created': 'client_created',
        'updated': 'client_updated',
        'birthday': 'birthday_reminder',
        'anniversary': 'anniversary_reminder',
      };

      const mappedTriggerType = triggerMappings[triggerType];
      if (!mappedTriggerType) {
        console.error('Unknown client trigger type:', triggerType);
        return;
      }

      // Get applicable triggers
      const triggers = await db
        .select()
        .from(workflowTriggers)
        .where(
          and(
            eq(workflowTriggers.orgId, orgId),
            eq(workflowTriggers.triggerType, mappedTriggerType),
            eq(workflowTriggers.isActive, true)
          )
        )
        .orderBy(desc(workflowTriggers.priority));

      // Process each trigger
      for (const trigger of triggers) {
        try {
          const shouldExecute = await this.evaluateTriggerConditions(
            trigger,
            {
              orgId,
              clientId: client.id,
              triggerData: {
                client,
                triggerType,
                ...metadata,
              },
            }
          );

          if (shouldExecute) {
            await this.executeTrigger(trigger, {
              orgId,
              clientId: client.id,
              triggerData: {
                client,
                triggerType,
                ...metadata,
              },
            });
          }
        } catch (error) {
          console.error(`Error processing client trigger ${trigger.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in processClientTrigger:', error);
      throw error;
    }
  }

  // Evaluate if trigger conditions are met
  private async evaluateTriggerConditions(
    trigger: any,
    context: TriggerContext
  ): Promise<boolean> {
    try {
      const conditions = trigger.conditions || {};

      // Check appointment type conditions
      if (conditions.appointmentTypes?.length > 0 && context.triggerData.appointment) {
        const appointmentType = context.triggerData.appointment.type || 'general';
        if (!conditions.appointmentTypes.includes(appointmentType)) {
          console.log(`Trigger ${trigger.id} skipped: appointment type mismatch`);
          return false;
        }
      }

      // Check client tag conditions
      if (conditions.clientTags?.length > 0 && context.triggerData.client) {
        const clientTags = context.triggerData.client.tags || [];
        const hasMatchingTag = conditions.clientTags.some((tag: string) => 
          clientTags.includes(tag)
        );
        if (!hasMatchingTag) {
          console.log(`Trigger ${trigger.id} skipped: client tag mismatch`);
          return false;
        }
      }

      // Check time-based conditions
      if (conditions.daysBefore || conditions.daysAfter) {
        // This would be used for reminder triggers
        // Implementation depends on specific trigger timing logic
      }

      // Check if client is already enrolled in this workflow
      if (trigger.workflowId && context.clientId) {
        const existingEnrollment = await db
          .select()
          .from(workflowEnrollments)
          .where(
            and(
              eq(workflowEnrollments.clientId, context.clientId),
              eq(workflowEnrollments.workflowId, trigger.workflowId),
              eq(workflowEnrollments.isActive, true)
            )
          )
          .limit(1);

        if (existingEnrollment.length > 0) {
          // Check if we should restart or skip
          if (trigger.restartIfActive) {
            console.log(`Restarting workflow for client ${context.clientId}`);
            // Cancel existing enrollment
            await db
              .update(workflowEnrollments)
              .set({
                isActive: false,
                completedAt: new Date(),
                status: 'cancelled',
              })
              .where(eq(workflowEnrollments.id, existingEnrollment[0].id));
          } else {
            console.log(`Trigger ${trigger.id} skipped: client already enrolled`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating trigger conditions:', error);
      return false;
    }
  }

  // Execute a workflow trigger
  private async executeTrigger(
    trigger: any,
    context: TriggerContext
  ): Promise<void> {
    try {
      console.log(`Executing trigger ${trigger.id} for context:`, {
        orgId: context.orgId,
        clientId: context.clientId,
        appointmentId: context.appointmentId,
      });

      // If this trigger is associated with a workflow, enroll the client
      if (trigger.workflowId && context.clientId) {
        await this.enrollClientInWorkflow(
          trigger.workflowId,
          context.clientId,
          context.orgId,
          {
            triggerId: trigger.id,
            triggerType: trigger.triggerType,
            appointmentId: context.appointmentId,
            triggerData: context.triggerData,
          }
        );
      }

      // Execute immediate actions
      if (trigger.immediateActions?.length > 0) {
        for (const action of trigger.immediateActions) {
          await this.executeAction(action, context);
        }
      }

      // Log trigger execution
      console.log(`Trigger ${trigger.id} executed successfully`);

    } catch (error) {
      console.error(`Error executing trigger ${trigger.id}:`, error);
      throw error;
    }
  }

  // Enroll client in a workflow
  private async enrollClientInWorkflow(
    workflowId: number,
    clientId: number,
    orgId: number,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // Get workflow details
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, workflowId),
            eq(workflows.orgId, orgId),
            eq(workflows.isActive, true)
          )
        )
        .limit(1);

      if (workflow.length === 0) {
        throw new Error(`Workflow ${workflowId} not found or inactive`);
      }

      // Create enrollment
      const enrollment = await db
        .insert(workflowEnrollments)
        .values({
          orgId,
          workflowId,
          clientId,
          status: 'active',
          isActive: true,
          enrolledAt: new Date(),
          currentStepIndex: 0,
          metadata: JSON.stringify(metadata),
        });

      console.log(`Client ${clientId} enrolled in workflow ${workflowId}`);

      // TODO: Start processing workflow steps
      // This would trigger the workflow execution engine

    } catch (error) {
      console.error('Error enrolling client in workflow:', error);
      throw error;
    }
  }

  // Execute a specific action
  private async executeAction(
    action: WorkflowAction,
    context: TriggerContext
  ): Promise<void> {
    try {
      console.log(`Executing action: ${action.type}`);

      switch (action.type) {
        case 'send_email':
          if (action.templateId) {
            // TODO: Queue email for sending
            console.log(`Queuing email template ${action.templateId} for client ${context.clientId}`);
          }
          break;

        case 'send_sms':
          if (action.templateId) {
            // TODO: Queue SMS for sending
            console.log(`Queuing SMS template ${action.templateId} for client ${context.clientId}`);
          }
          break;

        case 'create_task':
          // TODO: Create task for staff
          console.log(`Creating task for client ${context.clientId}`);
          break;

        case 'add_tag':
          // TODO: Add tag to client
          console.log(`Adding tag to client ${context.clientId}`);
          break;

        case 'update_status':
          // TODO: Update client or appointment status
          console.log(`Updating status for client ${context.clientId}`);
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }

    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      throw error;
    }
  }
}

// Create global instance
export const workflowTriggerEngine = new WorkflowTriggerEngine();

// Helper function to trigger workflows from appointment changes
export async function triggerAppointmentWorkflow(
  orgId: number,
  appointmentId: number,
  triggerType: 'scheduled' | 'completed' | 'no_show' | 'rescheduled' | 'cancelled',
  metadata: Record<string, any> = {}
): Promise<void> {
  return workflowTriggerEngine.processAppointmentTrigger(
    orgId,
    appointmentId,
    triggerType,
    metadata
  );
}

// Helper function to trigger workflows from client changes
export async function triggerClientWorkflow(
  orgId: number,
  clientId: number,
  triggerType: 'created' | 'updated' | 'birthday' | 'anniversary',
  metadata: Record<string, any> = {}
): Promise<void> {
  return workflowTriggerEngine.processClientTrigger(
    orgId,
    clientId,
    triggerType,
    metadata
  );
}