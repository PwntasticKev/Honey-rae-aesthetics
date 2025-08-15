/**
 * Utility functions for the Convex backend.
 */

// This is a placeholder for a more robust environment check
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Gets the recipient's email address. In development, it can be overridden
 * by an environment variable to prevent sending emails to real customers.
 * @param client The client document, containing the real email.
 * @returns The email address to send the message to.
 */
export function getRecipientEmail(client: { email?: string }): string | null {
  const overrideEmail = process.env.DEV_OVERRIDE_EMAIL;
  if (isDevelopment && overrideEmail) {
    console.log(`DEV OVERRIDE: Email redirected to ${overrideEmail}`);
    return overrideEmail;
  }
  return client.email || null;
}

/**
 * Gets the recipient's phone number. In development, it can be overridden
 * by an environment variable to prevent sending SMS to real customers.
 * @param client The client document, containing the real phone numbers.
 * @returns The phone number to send the message to.
 */
export function getRecipientPhone(client: {
  phones?: string[];
}): string | null {
  const overridePhone = process.env.DEV_OVERRIDE_PHONE;
  if (isDevelopment && overridePhone) {
    console.log(`DEV OVERRIDE: SMS redirected to ${overridePhone}`);
    return overridePhone;
  }
  if (client.phones && client.phones.length > 0) {
    return client.phones[0];
  }
  return null;
}
