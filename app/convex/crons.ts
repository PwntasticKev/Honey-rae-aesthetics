import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process workflow triggers every 5 minutes
crons.interval(
  "process workflow triggers",
  { minutes: 5 }, // Run every 5 minutes
  internal.workflowScheduler.processWorkflowTriggers,
);

// Process scheduled workflow steps every minute
crons.interval(
  "process scheduled steps",
  { minutes: 1 }, // Run every minute
  internal.workflowScheduler.processScheduledWorkflowSteps,
);

// Note: Calendar sync is handled within workflowScheduler processing

export default crons;
