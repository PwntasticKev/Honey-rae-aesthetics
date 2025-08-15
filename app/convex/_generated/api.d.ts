/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiSuggestions from "../aiSuggestions.js";
import type * as appointmentTriggers from "../appointmentTriggers.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as awsConfig from "../awsConfig.js";
import type * as bulkImport from "../bulkImport.js";
import type * as bulkMessages from "../bulkMessages.js";
import type * as clients from "../clients.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as demo from "../demo.js";
import type * as enhancedWorkflowEngine from "../enhancedWorkflowEngine.js";
import type * as enhancedWorkflows from "../enhancedWorkflows.js";
import type * as files from "../files.js";
import type * as googleCalendar from "../googleCalendar.js";
import type * as googleCalendarProviders from "../googleCalendarProviders.js";
import type * as integrations from "../integrations.js";
import type * as internalBulkImport from "../internalBulkImport.js";
import type * as internalSocialMedia from "../internalSocialMedia.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as orgSettings from "../orgSettings.js";
import type * as orgs from "../orgs.js";
import type * as scheduledActions from "../scheduledActions.js";
import type * as search from "../search.js";
import type * as security from "../security.js";
import type * as socialMedia from "../socialMedia.js";
import type * as teamManagement from "../teamManagement.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as workflowDirectories from "../workflowDirectories.js";
import type * as workflowExecutions from "../workflowExecutions.js";
import type * as workflowScheduler from "../workflowScheduler.js";
import type * as workflows from "../workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiSuggestions: typeof aiSuggestions;
  appointmentTriggers: typeof appointmentTriggers;
  appointments: typeof appointments;
  auth: typeof auth;
  awsConfig: typeof awsConfig;
  bulkImport: typeof bulkImport;
  bulkMessages: typeof bulkMessages;
  clients: typeof clients;
  crons: typeof crons;
  debug: typeof debug;
  demo: typeof demo;
  enhancedWorkflowEngine: typeof enhancedWorkflowEngine;
  enhancedWorkflows: typeof enhancedWorkflows;
  files: typeof files;
  googleCalendar: typeof googleCalendar;
  googleCalendarProviders: typeof googleCalendarProviders;
  integrations: typeof integrations;
  internalBulkImport: typeof internalBulkImport;
  internalSocialMedia: typeof internalSocialMedia;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  notes: typeof notes;
  notifications: typeof notifications;
  orgSettings: typeof orgSettings;
  orgs: typeof orgs;
  scheduledActions: typeof scheduledActions;
  search: typeof search;
  security: typeof security;
  socialMedia: typeof socialMedia;
  teamManagement: typeof teamManagement;
  users: typeof users;
  utils: typeof utils;
  workflowDirectories: typeof workflowDirectories;
  workflowExecutions: typeof workflowExecutions;
  workflowScheduler: typeof workflowScheduler;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
