import { organizationProfileSchema, sanitizeHtml, validateAndSanitizeUrl } from './validation-schemas';
import { z } from 'zod';

export interface OrganizationProfile {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  description?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingRequired: string[];
  warnings: string[];
}

// Function to validate organization profile using Zod
export function validateOrganizationProfile(profile: OrganizationProfile): ValidationResult {
  const errors: string[] = [];
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Sanitize inputs first
  const sanitizedProfile = {
    ...profile,
    name: sanitizeHtml(profile.name || '').trim(),
    email: profile.email?.trim(),
    phone: profile.phone?.trim(),
    address: sanitizeHtml(profile.address || '').trim(),
    website: profile.website?.trim(),
    industry: sanitizeHtml(profile.industry || '').trim(),
    description: sanitizeHtml(profile.description || '').trim(),
  };

  // Validate with Zod schema
  const result = organizationProfileSchema.safeParse({
    ...sanitizedProfile,
    timezone: 'America/Denver', // Default timezone
    currency: 'USD', // Default currency
  });

  if (!result.success) {
    result.error.issues.forEach(error => {
      const field = error.path[0] as string;
      const message = error.message;
      
      if (error.code === 'too_small' && (error as any).minimum === 1) {
        // Required field is empty
        missingRequired.push(message);
      } else {
        // Format or validation error
        errors.push(message);
      }
    });
  }

  // Handle website validation with custom sanitization
  if (sanitizedProfile.website && sanitizedProfile.website.length > 0) {
    const sanitizedUrl = validateAndSanitizeUrl(sanitizedProfile.website);
    if (!sanitizedUrl) {
      errors.push('Website URL format is invalid');
    }
  }

  // Add warnings for optional fields
  if (!sanitizedProfile.website || sanitizedProfile.website.length === 0) {
    warnings.push('Website URL is recommended for better online presence');
  }

  if (!sanitizedProfile.description || sanitizedProfile.description.length === 0) {
    warnings.push('Organization description helps clients understand your services');
  }

  const isValid = errors.length === 0 && missingRequired.length === 0;

  return {
    isValid,
    errors,
    missingRequired,
    warnings,
  };
}

export function getOrganizationSetupProgress(profile: OrganizationProfile): {
  completedSteps: number;
  totalSteps: number;
  completionPercentage: number;
  nextStep?: string;
} {
  const requiredFields = ['name', 'email', 'phone', 'address', 'industry'];
  const optionalFields = ['website', 'description'];
  
  let completedRequired = 0;
  let completedOptional = 0;
  let nextStep: string | undefined;

  requiredFields.forEach(field => {
    const value = profile[field as keyof OrganizationProfile];
    if (value && value.trim().length > 0) {
      completedRequired++;
    } else if (!nextStep) {
      nextStep = `Complete ${field.charAt(0).toUpperCase() + field.slice(1)}`;
    }
  });

  optionalFields.forEach(field => {
    const value = profile[field as keyof OrganizationProfile];
    if (value && value.trim().length > 0) {
      completedOptional++;
    }
  });

  const totalSteps = requiredFields.length + optionalFields.length;
  const completedSteps = completedRequired + completedOptional;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  if (completedRequired === requiredFields.length && !nextStep) {
    nextStep = 'Add website or description to complete profile';
  }

  return {
    completedSteps,
    totalSteps,
    completionPercentage,
    nextStep,
  };
}