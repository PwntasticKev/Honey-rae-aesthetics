import { db } from "@/lib/db";
import { clients, potentialDuplicates } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// Levenshtein distance algorithm for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Calculate similarity percentage between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const normalizedStr1 = str1.toLowerCase().trim();
  const normalizedStr2 = str2.toLowerCase().trim();
  
  if (normalizedStr1 === normalizedStr2) return 100;
  
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(normalizedStr1, normalizedStr2);
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

// Extract and normalize name components
function parseFullName(fullName: string): { firstName: string; lastName: string; fullName: string } {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');
  
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    fullName: normalized.toLowerCase(),
  };
}

// Normalize phone number for comparison
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^1/, ''); // Remove formatting and leading 1
}

// Common nickname mappings
const nicknameMap: Record<string, string[]> = {
  'william': ['bill', 'billy', 'will', 'willy'],
  'robert': ['bob', 'bobby', 'rob', 'robbie'],
  'richard': ['rick', 'ricky', 'dick', 'rich'],
  'michael': ['mike', 'micky', 'mick'],
  'david': ['dave', 'davey'],
  'daniel': ['dan', 'danny'],
  'christopher': ['chris'],
  'matthew': ['matt'],
  'anthony': ['tony'],
  'jennifer': ['jen', 'jenny'],
  'elizabeth': ['liz', 'beth', 'betsy', 'betty'],
  'patricia': ['pat', 'patty', 'trish'],
  'barbara': ['barb', 'barbara'],
  'margaret': ['maggie', 'peggy', 'meg'],
  'dorothy': ['dot', 'dotty'],
  'katherine': ['kate', 'katie', 'kathy', 'kay'],
  'susan': ['sue', 'suzy'],
  'sarah': ['sara'],
  'rebecca': ['becky', 'becca'],
  'stephanie': ['steph'],
  'catherine': ['cathy', 'cat'],
};

// Check if two names could be the same person (accounting for nicknames)
function areNamesEquivalent(name1: string, name2: string): boolean {
  const norm1 = name1.toLowerCase().trim();
  const norm2 = name2.toLowerCase().trim();
  
  if (norm1 === norm2) return true;
  
  // Check nickname mappings
  for (const [fullName, nicknames] of Object.entries(nicknameMap)) {
    if ((norm1 === fullName && nicknames.includes(norm2)) ||
        (norm2 === fullName && nicknames.includes(norm1)) ||
        (nicknames.includes(norm1) && nicknames.includes(norm2))) {
      return true;
    }
  }
  
  return false;
}

// Main client matching interface
export interface ClientMatchCandidate {
  client: any; // Client record from database
  confidence: number; // 0-100 confidence score
  matchType: 'email' | 'phone' | 'name' | 'combined';
  matchingFields: {
    email?: boolean;
    phone?: boolean;
    firstName?: boolean;
    lastName?: boolean;
    dateOfBirth?: boolean;
  };
  reasons: string[]; // Explanation of why this is a match
}

export interface SmartMatchingOptions {
  email?: string;
  phone?: string;
  fullName: string;
  dateOfBirth?: string;
  threshold?: number; // Minimum confidence to consider a match (default 60)
  createDuplicateRecord?: boolean; // Whether to record potential duplicates
}

// Main smart matching function
export async function findClientMatches(
  orgId: number,
  options: SmartMatchingOptions
): Promise<ClientMatchCandidate[]> {
  const { email, phone, fullName, dateOfBirth, threshold = 60, createDuplicateRecord = true } = options;
  
  // Get all clients for the organization
  const orgClients = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, orgId));

  const candidates: ClientMatchCandidate[] = [];
  const inputName = parseFullName(fullName);
  const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;

  for (const client of orgClients) {
    const matchingFields: any = {};
    const reasons: string[] = [];
    let confidence = 0;
    let matchType: 'email' | 'phone' | 'name' | 'combined' = 'name';

    // Email matching (highest confidence)
    if (email && client.email.toLowerCase() === email.toLowerCase()) {
      confidence = 100;
      matchType = 'email';
      matchingFields.email = true;
      reasons.push('Exact email match');
    }

    // Phone number matching (high confidence)
    if (normalizedPhone && client.phones) {
      for (const clientPhone of client.phones) {
        if (normalizePhoneNumber(clientPhone) === normalizedPhone) {
          confidence = Math.max(confidence, 95);
          matchType = confidence === 95 ? 'phone' : 'combined';
          matchingFields.phone = true;
          reasons.push('Exact phone number match');
          break;
        }
      }
    }

    // Name matching (variable confidence based on similarity)
    const clientName = parseFullName(client.fullName);
    
    // First name comparison
    const firstNameSimilarity = calculateSimilarity(inputName.firstName, clientName.firstName);
    const firstNameEquivalent = areNamesEquivalent(inputName.firstName, clientName.firstName);
    
    if (firstNameEquivalent || firstNameSimilarity >= 85) {
      matchingFields.firstName = true;
      reasons.push(firstNameEquivalent ? 'First name equivalent (nickname)' : `First name similar (${firstNameSimilarity}%)`);
    }

    // Last name comparison
    const lastNameSimilarity = calculateSimilarity(inputName.lastName, clientName.lastName);
    
    if (lastNameSimilarity >= 85) {
      matchingFields.lastName = true;
      reasons.push(`Last name similar (${lastNameSimilarity}%)`);
    }

    // Full name comparison
    const fullNameSimilarity = calculateSimilarity(inputName.fullName, clientName.fullName);
    
    // Date of birth matching (if available)
    if (dateOfBirth && client.dateOfBirth && client.dateOfBirth === dateOfBirth) {
      matchingFields.dateOfBirth = true;
      reasons.push('Date of birth match');
      confidence += 20; // Boost confidence for DOB match
    }

    // Calculate name-based confidence
    if (matchingFields.firstName && matchingFields.lastName) {
      const nameConfidence = Math.round((firstNameSimilarity + lastNameSimilarity) / 2);
      confidence = Math.max(confidence, nameConfidence);
      if (confidence === nameConfidence) {
        matchType = matchingFields.email || matchingFields.phone ? 'combined' : 'name';
      }
    } else if (matchingFields.firstName || matchingFields.lastName) {
      const nameConfidence = Math.round(fullNameSimilarity * 0.8); // Partial name match
      confidence = Math.max(confidence, nameConfidence);
      if (confidence === nameConfidence) {
        matchType = matchingFields.email || matchingFields.phone ? 'combined' : 'name';
      }
    } else if (fullNameSimilarity >= 70) {
      confidence = Math.max(confidence, Math.round(fullNameSimilarity * 0.7));
      if (confidence === Math.round(fullNameSimilarity * 0.7)) {
        matchType = matchingFields.email || matchingFields.phone ? 'combined' : 'name';
      }
      reasons.push(`Full name similar (${fullNameSimilarity}%)`);
    }

    // Only include candidates above threshold
    if (confidence >= threshold && reasons.length > 0) {
      candidates.push({
        client,
        confidence,
        matchType,
        matchingFields,
        reasons,
      });
    }
  }

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Record potential duplicates for manual review
  if (createDuplicateRecord && candidates.length > 0) {
    const topCandidate = candidates[0];
    if (topCandidate.confidence < 95) { // Don't record high-confidence matches as duplicates
      try {
        await recordPotentialDuplicate(orgId, topCandidate, options);
      } catch (error) {
        console.error('Error recording potential duplicate:', error);
        // Don't fail the matching process if duplicate recording fails
      }
    }
  }

  return candidates;
}

// Record potential duplicate for manual review
async function recordPotentialDuplicate(
  orgId: number,
  candidate: ClientMatchCandidate,
  inputData: SmartMatchingOptions
): Promise<void> {
  // For recording purposes, we need a temporary client ID
  // In practice, this would be called after creating a new client
  // For now, we'll just log the potential duplicate
  console.log('Potential duplicate detected:', {
    existingClient: candidate.client.fullName,
    newClient: inputData.fullName,
    confidence: candidate.confidence,
    reasons: candidate.reasons,
  });
}

// Utility function to find the best match
export function getBestMatch(candidates: ClientMatchCandidate[]): ClientMatchCandidate | null {
  if (candidates.length === 0) return null;
  
  // Return highest confidence match that's above 90%
  const bestCandidate = candidates[0];
  return bestCandidate.confidence >= 90 ? bestCandidate : null;
}

// Utility function to check if manual review is needed
export function needsManualReview(candidates: ClientMatchCandidate[]): boolean {
  if (candidates.length === 0) return false;
  
  const bestMatch = candidates[0];
  
  // Manual review needed if:
  // 1. Best match is between 60-89% confidence
  // 2. Multiple candidates with similar confidence
  if (bestMatch.confidence >= 60 && bestMatch.confidence < 90) {
    return true;
  }
  
  if (candidates.length > 1) {
    const secondBest = candidates[1];
    const confidenceDiff = bestMatch.confidence - secondBest.confidence;
    // If top two matches are within 10% confidence, needs manual review
    return confidenceDiff < 10;
  }
  
  return false;
}

// Export utility functions for external use
export {
  calculateSimilarity,
  parseFullName,
  normalizePhoneNumber,
  areNamesEquivalent,
  levenshteinDistance,
};