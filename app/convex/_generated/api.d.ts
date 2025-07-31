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
import type * as appointments from "../appointments.js";
import type * as awsConfig from "../awsConfig.js";
import type * as bulkMessages from "../bulkMessages.js";
import type * as clients from "../clients.js";
import type * as debug from "../debug.js";
import type * as demo from "../demo.js";
import type * as files from "../files.js";
import type * as googleCalendar from "../googleCalendar.js";
import type * as googleCalendarProviders from "../googleCalendarProviders.js";
import type * as messageTemplates from "../messageTemplates.js";
import type * as messages from "../messages.js";
import type * as notes from "../notes.js";
import type * as orgs from "../orgs.js";
import type * as users from "../users.js";
import type * as workflowExecutions from "../workflowExecutions.js";
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
  appointments: typeof appointments;
  awsConfig: typeof awsConfig;
  bulkMessages: typeof bulkMessages;
  clients: typeof clients;
  debug: typeof debug;
  demo: typeof demo;
  files: typeof files;
  googleCalendar: typeof googleCalendar;
  googleCalendarProviders: typeof googleCalendarProviders;
  messageTemplates: typeof messageTemplates;
  messages: typeof messages;
  notes: typeof notes;
  orgs: typeof orgs;
  users: typeof users;
  workflowExecutions: typeof workflowExecutions;
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
