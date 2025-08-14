import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Enhanced workflow execution with message variable substitution
export const executeWorkflowStep = internalMutation({
  args: {
    enrollmentId: v.id("workflowEnrollments"),
    stepId: v.string(),
    stepType: v.string(),
    stepConfig: v.any(),
  },
  handler: async (ctx, args) => {
    console.log(`🚀 Executing workflow step: ${args.stepType} for enrollment ${args.enrollmentId}`);
    
    try {
      // Get enrollment, workflow, and client data
      const enrollment = await ctx.db.get(args.enrollmentId);
      if (!enrollment) throw new Error("Enrollment not found");
      
      const workflow = await ctx.db.get(enrollment.workflowId);
      if (!workflow) throw new Error("Workflow not found");
      
      const client = await ctx.db.get(enrollment.clientId);
      if (!client) throw new Error("Client not found");
      
      const org = await ctx.db.get(enrollment.orgId);
      if (!org) throw new Error("Organization not found");
      
      // Get appointment data if available
      const appointment = enrollment.metadata?.appointmentId 
        ? await ctx.db.get(enrollment.metadata.appointmentId)
        : null;
      
      let executionResult = null;
      
      // Execute step based on type
      switch (args.stepType) {
        case "send_sms":
          executionResult = await executeSMSStep(ctx, {
            enrollment,
            client,
            org,
            appointment,
            stepConfig: args.stepConfig
          });
          break;
        
        case "send_email":
          executionResult = await executeEmailStep(ctx, {
            enrollment,
            client,
            org,
            appointment,
            stepConfig: args.stepConfig
          });
          break;
        
        case "add_tag":
          executionResult = await executeAddTagStep(ctx, {
            client,
            stepConfig: args.stepConfig
          });
          break;
        
        case "remove_tag":
          executionResult = await executeRemoveTagStep(ctx, {
            client,
            stepConfig: args.stepConfig
          });
          break;
        
        case "delay":
          executionResult = await executeDelayStep(ctx, {
            enrollment,
            stepConfig: args.stepConfig
          });
          break;
        
        case "if":
          executionResult = await executeConditionalStep(ctx, {
            client,
            appointment,
            stepConfig: args.stepConfig
          });
          break;
        
        default:
          throw new Error(`Unknown step type: ${args.stepType}`);
      }
      
      // Log successful execution
      await ctx.db.insert("executionLogs", {
        orgId: enrollment.orgId,
        workflowId: enrollment.workflowId,
        enrollmentId: enrollment._id,
        clientId: enrollment.clientId,
        stepId: args.stepId,
        action: args.stepType,
        status: "executed",
        executedAt: Date.now(),
        message: `Successfully executed ${args.stepType} step`,
        metadata: {
          stepConfig: args.stepConfig,
          result: executionResult
        }
      });
      
      return { success: true, result: executionResult };
      
    } catch (error) {
      console.error(`❌ Error executing workflow step:`, error);
      
      // Log failed execution
      const enrollment = await ctx.db.get(args.enrollmentId);
      if (enrollment) {
        await ctx.db.insert("executionLogs", {
          orgId: enrollment.orgId,
          workflowId: enrollment.workflowId,
          enrollmentId: enrollment._id,
          clientId: enrollment.clientId,
          stepId: args.stepId,
          action: args.stepType,
          status: "failed",
          executedAt: Date.now(),
          message: `Failed to execute ${args.stepType} step`,
          error: String(error),
          metadata: { stepConfig: args.stepConfig }
        });
      }
      
      throw error;
    }
  },
});

// Helper function to substitute variables in messages
function substituteVariables(
  text: string,
  client: any,
  org: any,
  appointment?: any
): string {
  if (!text) return "";
  
  let result = text;
  
  // Client variables
  result = result.replace(/\{\{first_name\}\}/g, client.firstName || client.fullName?.split(" ")[0] || "there");
  result = result.replace(/\{\{last_name\}\}/g, client.lastName || client.fullName?.split(" ").slice(1).join(" ") || "");
  result = result.replace(/\{\{client_name\}\}/g, client.fullName || "there");
  result = result.replace(/\{\{phone\}\}/g, client.phones?.[0] || "your phone");
  result = result.replace(/\{\{email\}\}/g, client.email || "your email");
  
  // Appointment variables
  if (appointment) {
    const appointmentDate = new Date(appointment.dateTime);
    result = result.replace(/\{\{appointment_date\}\}/g, appointmentDate.toLocaleDateString());
    result = result.replace(/\{\{appointment_time\}\}/g, appointmentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    result = result.replace(/\{\{appointment_type\}\}/g, appointment.type || "appointment");
  }
  
  // Org/Business variables (these could be configured in org settings)
  result = result.replace(/\{\{google_review_link\}\}/g, getGoogleReviewLink(org));
  result = result.replace(/\{\{business_name\}\}/g, org.name || "our clinic");
  result = result.replace(/\{\{business_phone\}\}/g, "(555) 123-4567"); // Could be from org settings
  result = result.replace(/\{\{booking_link\}\}/g, "https://book.honeyraeaesthetics.com"); // Could be from org settings
  
  return result;
}

// Get Google review link (could be configured in org settings)
function getGoogleReviewLink(org: any): string {
  // This could be stored in org settings
  return "https://g.page/r/YourBusinessReviewLink";
}

// Execute SMS step
async function executeSMSStep(ctx: any, data: any) {
  const { enrollment, client, org, appointment, stepConfig } = data;
  
  if (!client.phones || client.phones.length === 0) {
    throw new Error("Client has no phone number for SMS");
  }
  
  const message = substituteVariables(stepConfig.message, client, org, appointment);
  
  // For now, log the SMS (in production, integrate with your SMS service)
  console.log(`📱 SMS to ${client.phones[0]}: ${message}`);
  
  // Store message record
  const messageId = await ctx.db.insert("messages", {
    orgId: enrollment.orgId,
    clientId: client._id,
    type: "sms",
    content: message,
    status: "sent", // In production, this would be "pending" initially
    sentAt: Date.now(),
    createdAt: Date.now()
  });
  
  return {
    messageId,
    recipient: client.phones[0],
    content: message,
    type: "sms"
  };
}

// Execute Email step
async function executeEmailStep(ctx: any, data: any) {
  const { enrollment, client, org, appointment, stepConfig } = data;
  
  if (!client.email) {
    throw new Error("Client has no email address");
  }
  
  const subject = substituteVariables(stepConfig.subject, client, org, appointment);
  const body = substituteVariables(stepConfig.body, client, org, appointment);
  
  // For now, log the email (in production, integrate with your email service)
  console.log(`📧 Email to ${client.email}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // Store message record
  const messageId = await ctx.db.insert("messages", {
    orgId: enrollment.orgId,
    clientId: client._id,
    type: "email",
    content: `Subject: ${subject}\n\n${body}`,
    status: "sent", // In production, this would be "pending" initially
    sentAt: Date.now(),
    createdAt: Date.now()
  });
  
  return {
    messageId,
    recipient: client.email,
    subject,
    body,
    type: "email"
  };
}

// Execute Add Tag step
async function executeAddTagStep(ctx: any, data: any) {
  const { client, stepConfig } = data;
  
  const tagToAdd = stepConfig.tag;
  if (!tagToAdd) {
    throw new Error("No tag specified to add");
  }
  
  const currentTags = client.tags || [];
  
  if (!currentTags.includes(tagToAdd)) {
    const updatedTags = [...currentTags, tagToAdd];
    await ctx.db.patch(client._id, {
      tags: updatedTags,
      updatedAt: Date.now()
    });
    
    return {
      action: "tag_added",
      tag: tagToAdd,
      previousTags: currentTags,
      newTags: updatedTags
    };
  }
  
  return {
    action: "tag_already_exists",
    tag: tagToAdd,
    tags: currentTags
  };
}

// Execute Remove Tag step
async function executeRemoveTagStep(ctx: any, data: any) {
  const { client, stepConfig } = data;
  
  const currentTags = client.tags || [];
  let updatedTags;
  
  if (stepConfig.removeAll === "true" || stepConfig.removeAll === true) {
    // Remove all tags
    updatedTags = [];
  } else {
    // Remove specific tag
    const tagToRemove = stepConfig.tag;
    if (!tagToRemove) {
      throw new Error("No tag specified to remove");
    }
    updatedTags = currentTags.filter((tag: string) => tag !== tagToRemove);
  }
  
  await ctx.db.patch(client._id, {
    tags: updatedTags,
    updatedAt: Date.now()
  });
  
  return {
    action: stepConfig.removeAll ? "all_tags_removed" : "tag_removed",
    removedTag: stepConfig.removeAll ? null : stepConfig.tag,
    previousTags: currentTags,
    newTags: updatedTags
  };
}

// Execute Delay step
async function executeDelayStep(ctx: any, data: any) {
  const { enrollment, stepConfig } = data;
  
  const { value, unit } = stepConfig;
  let delayMs = 0;
  
  // Calculate delay in milliseconds
  switch (unit) {
    case "seconds":
      delayMs = value * 1000;
      break;
    case "minutes":
      delayMs = value * 60 * 1000;
      break;
    case "hours":
      delayMs = value * 60 * 60 * 1000;
      break;
    case "days":
      delayMs = value * 24 * 60 * 60 * 1000;
      break;
    case "weeks":
      delayMs = value * 7 * 24 * 60 * 60 * 1000;
      break;
    case "months":
      delayMs = value * 30 * 24 * 60 * 60 * 1000; // Approximate
      break;
    default:
      delayMs = value * 24 * 60 * 60 * 1000; // Default to days
  }
  
  const nextExecutionTime = Date.now() + delayMs;
  
  // Schedule next step execution
  await ctx.db.insert("scheduledActions", {
    orgId: enrollment.orgId,
    action: "continue_workflow",
    args: {
      enrollmentId: enrollment._id,
      delayCompleted: true
    },
    scheduledFor: nextExecutionTime,
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  
  // Update enrollment with next execution time
  await ctx.db.patch(enrollment._id, {
    nextExecutionAt: nextExecutionTime,
    updatedAt: Date.now()
  });
  
  return {
    action: "delay_scheduled",
    delayValue: value,
    delayUnit: unit,
    delayMs,
    nextExecutionAt: nextExecutionTime
  };
}

// Execute Conditional step
async function executeConditionalStep(ctx: any, data: any) {
  const { client, appointment, stepConfig } = data;
  
  const { field, operator, value } = stepConfig;
  let conditionMet = false;
  
  // Evaluate condition based on field
  switch (field) {
    case "tags":
      conditionMet = evaluateTagCondition(client.tags || [], operator, value);
      break;
    case "appointment_count":
      const appointmentCount = await getClientAppointmentCount(ctx, client._id);
      conditionMet = evaluateNumericCondition(appointmentCount, operator, parseInt(value));
      break;
    case "appointment_type":
      const currentType = appointment?.type || "";
      conditionMet = evaluateStringCondition(currentType, operator, value);
      break;
    case "client_status":
      conditionMet = evaluateStringCondition(client.clientPortalStatus, operator, value);
      break;
    case "last_appointment_date":
      const lastAppointmentDate = await getLastAppointmentDate(ctx, client._id);
      conditionMet = evaluateDateCondition(lastAppointmentDate, operator, value);
      break;
    default:
      throw new Error(`Unknown condition field: ${field}`);
  }
  
  return {
    action: "condition_evaluated",
    field,
    operator,
    value,
    conditionMet,
    nextPath: conditionMet ? "true" : "false"
  };
}

// Helper functions for condition evaluation
function evaluateTagCondition(tags: string[], operator: string, value: string): boolean {
  switch (operator) {
    case "contains":
    case "has_tag":
      return tags.includes(value);
    case "not_has_tag":
      return !tags.includes(value);
    default:
      return false;
  }
}

function evaluateNumericCondition(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "greater_than":
      return actual > expected;
    case "less_than":
      return actual < expected;
    default:
      return false;
  }
}

function evaluateStringCondition(actual: string, operator: string, expected: string): boolean {
  const actualLower = actual.toLowerCase();
  const expectedLower = expected.toLowerCase();
  
  switch (operator) {
    case "equals":
      return actualLower === expectedLower;
    case "not_equals":
      return actualLower !== expectedLower;
    case "contains":
      return actualLower.includes(expectedLower);
    default:
      return false;
  }
}

function evaluateDateCondition(lastDate: number | null, operator: string, value: string): boolean {
  if (!lastDate) return false;
  
  const daysDiff = Math.floor((Date.now() - lastDate) / (24 * 60 * 60 * 1000));
  const expectedDays = parseInt(value);
  
  switch (operator) {
    case "greater_than":
      return daysDiff > expectedDays;
    case "less_than":
      return daysDiff < expectedDays;
    default:
      return false;
  }
}

// Helper function to get client appointment count
async function getClientAppointmentCount(ctx: any, clientId: string): Promise<number> {
  const appointments = await ctx.db
    .query("appointments")
    .withIndex("by_client", (q: any) => q.eq("clientId", clientId))
    .collect();
  return appointments.length;
}

// Helper function to get last appointment date
async function getLastAppointmentDate(ctx: any, clientId: string): Promise<number | null> {
  const lastAppointment = await ctx.db
    .query("appointments")
    .withIndex("by_client", (q: any) => q.eq("clientId", clientId))
    .order("desc")
    .first();
  return lastAppointment?.dateTime || null;
}

// Test workflow with real messages
export const testWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    testClientId: v.optional(v.id("clients")),
    testContactEmail: v.optional(v.string()),
    testContactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`🧪 Testing workflow ${args.workflowId}`);
    
    try {
      const workflow = await ctx.db.get(args.workflowId);
      if (!workflow) throw new Error("Workflow not found");
      
      // Use provided test client or create a mock one
      let testClient;
      if (args.testClientId) {
        testClient = await ctx.db.get(args.testClientId);
        if (!testClient) throw new Error("Test client not found");
      } else {
        // Create mock test client
        testClient = {
          _id: "test_client",
          fullName: "Kevin Lee",
          firstName: "Kevin",
          lastName: "Lee",
          email: args.testContactEmail || "pwntastickevin@gmail.com",
          phones: [args.testContactPhone || "+18018850601"],
          tags: ["test_client", "VIP"],
          clientPortalStatus: "active"
        };
      }
      
      const org = await ctx.db.get(workflow.orgId);
      if (!org) throw new Error("Organization not found");
      
      // Create mock appointment
      const mockAppointment = {
        _id: "test_appointment",
        type: "Morpheus8 Treatment",
        dateTime: Date.now(),
        provider: "Test Provider"
      };
      
      const results = [];
      
      // Test each action block in the workflow
      for (const block of workflow.blocks || []) {
        if (block.type === "trigger") continue; // Skip trigger blocks
        
        try {
          let stepResult = null;
          
          switch (block.type) {
            case "send_sms":
              stepResult = await testSMSStep(testClient, org, mockAppointment, block.config);
              break;
            case "send_email":
              stepResult = await testEmailStep(testClient, org, mockAppointment, block.config);
              break;
            case "add_tag":
            case "remove_tag":
              stepResult = { action: block.type, config: block.config, simulated: true };
              break;
            case "delay":
              stepResult = { action: "delay", config: block.config, simulated: true };
              break;
            case "if":
              stepResult = { action: "condition", config: block.config, simulated: true };
              break;
          }
          
          results.push({
            blockId: block.id,
            blockType: block.type,
            success: true,
            result: stepResult
          });
          
        } catch (error) {
          results.push({
            blockId: block.id,
            blockType: block.type,
            success: false,
            error: String(error)
          });
        }
      }
      
      return {
        success: true,
        workflowName: workflow.name,
        testClient: {
          name: testClient.fullName,
          email: testClient.email,
          phone: testClient.phones?.[0]
        },
        results,
        totalSteps: results.length,
        successfulSteps: results.filter(r => r.success).length
      };
      
    } catch (error) {
      console.error("❌ Workflow test failed:", error);
      return {
        success: false,
        error: String(error)
      };
    }
  },
});

// Test SMS step (sends real SMS)
async function testSMSStep(client: any, org: any, appointment: any, stepConfig: any) {
  const message = substituteVariables(stepConfig.message, client, org, appointment);
  
  // For testing, always send to the test phone number
  const testPhone = "+18018850601";
  
  console.log(`🧪📱 TEST SMS to ${testPhone}: ${message}`);
  
  // Here you would integrate with your actual SMS service
  // For now, we'll just log it
  
  return {
    type: "sms",
    recipient: testPhone,
    content: message,
    sent: true,
    testMode: true
  };
}

// Test Email step (sends real email)
async function testEmailStep(client: any, org: any, appointment: any, stepConfig: any) {
  const subject = substituteVariables(stepConfig.subject, client, org, appointment);
  const body = substituteVariables(stepConfig.body, client, org, appointment);
  
  // For testing, always send to the test email
  const testEmail = "pwntastickevin@gmail.com";
  
  console.log(`🧪📧 TEST EMAIL to ${testEmail}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // Here you would integrate with your actual email service
  // For now, we'll just log it
  
  return {
    type: "email",
    recipient: testEmail,
    subject,
    body,
    sent: true,
    testMode: true
  };
}