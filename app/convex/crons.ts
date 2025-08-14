import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process workflow triggers every 5 minutes
crons.interval(
  "process workflow triggers",
  { minutes: 5 }, // Run every 5 minutes
  internal.workflowScheduler.processWorkflowTriggers
);

// Process scheduled workflow steps every minute
crons.interval(
  "process scheduled steps", 
  { minutes: 1 }, // Run every minute
  internal.workflowScheduler.processScheduledWorkflowSteps
);

// Sync Google Calendar data every 10 minutes
crons.interval(
  "sync calendar data",
  { minutes: 10 }, // Run every 10 minutes
  internal.googleCalendar.syncCalendarAppointments,
  { /* will need orgId and providerId - this would be configured per org */ }
);

export default crons;