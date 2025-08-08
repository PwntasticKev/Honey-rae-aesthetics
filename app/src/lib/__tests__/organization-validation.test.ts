import { describe, it, expect } from 'vitest';
import { 
  validateOrganizationProfile, 
  getOrganizationSetupProgress, 
  OrganizationProfile 
} from '../organization-validation';

describe('Organization Profile Validation', () => {
  describe('validateOrganizationProfile', () => {
    it('should pass validation for a complete profile', () => {
      const profile: OrganizationProfile = {
        name: 'Honey Rae Aesthetics',
        email: 'info@honeyrae.com',
        phone: '+1-555-123-4567',
        address: '123 Beauty Lane, Los Angeles, CA 90210',
        website: 'https://honeyrae.com',
        industry: 'Healthcare & Beauty',
        description: 'Premium aesthetic services and treatments',
      };

      const result = validateOrganizationProfile(profile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingRequired).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', () => {
      const profile: OrganizationProfile = {
        name: '',
        email: '',
        phone: '',
        address: '',
      };

      const result = validateOrganizationProfile(profile);
      
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('Organization name is required');
      expect(result.missingRequired).toContain('Organization email is required'); 
      expect(result.missingRequired).toContain('Address is required');
      expect(result.missingRequired).toContain('Industry selection is required');
      // Phone validation errors appear in errors array due to format validation
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate email format', () => {
      const profile: OrganizationProfile = {
        name: 'Test Org',
        email: 'invalid-email',
        phone: '+1-555-123-4567',
        address: '123 Test St',
        industry: 'Healthcare',
      };

      const result = validateOrganizationProfile(profile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should validate phone number format', () => {
      const profile: OrganizationProfile = {
        name: 'Test Org',
        email: 'test@example.com',
        phone: '123', // too short
        address: '123 Test St',
        industry: 'Healthcare',
      };

      const result = validateOrganizationProfile(profile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });

    it('should validate website URL format', () => {
      const profile: OrganizationProfile = {
        name: 'Test Org',
        email: 'test@example.com',
        phone: '+1-555-123-4567',
        address: '123 Test St',
        industry: 'Healthcare',
        website: 'just plain text',
      };

      const result = validateOrganizationProfile(profile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Website URL format is invalid');
    });

    it('should provide warnings for missing optional fields', () => {
      const profile: OrganizationProfile = {
        name: 'Test Org',
        email: 'test@example.com',
        phone: '+1-555-123-4567',
        address: '123 Test St',
        industry: 'Healthcare',
      };

      const result = validateOrganizationProfile(profile);
      
      expect(result.isValid).toBe(true); // Still valid without optional fields
      expect(result.warnings).toContain('Website URL is recommended for better online presence');
      expect(result.warnings).toContain('Organization description helps clients understand your services');
    });
  });

  describe('getOrganizationSetupProgress', () => {
    it('should calculate progress correctly for empty profile', () => {
      const profile: OrganizationProfile = {
        name: '',
      };

      const progress = getOrganizationSetupProgress(profile);
      
      expect(progress.completedSteps).toBe(0);
      expect(progress.totalSteps).toBe(7); // 5 required + 2 optional
      expect(progress.completionPercentage).toBe(0);
      expect(progress.nextStep).toBe('Complete Name');
    });

    it('should calculate progress correctly for partially complete profile', () => {
      const profile: OrganizationProfile = {
        name: 'Test Org',
        email: 'test@example.com',
        phone: '+1-555-123-4567',
      };

      const progress = getOrganizationSetupProgress(profile);
      
      expect(progress.completedSteps).toBe(3);
      expect(progress.totalSteps).toBe(7);
      expect(progress.completionPercentage).toBe(43); // 3/7 * 100 rounded
      expect(progress.nextStep).toBe('Complete Address');
    });

    it('should calculate progress correctly for complete profile', () => {
      const profile: OrganizationProfile = {
        name: 'Honey Rae Aesthetics',
        email: 'info@honeyrae.com',
        phone: '+1-555-123-4567',
        address: '123 Beauty Lane, Los Angeles, CA 90210',
        website: 'https://honeyrae.com',
        industry: 'Healthcare & Beauty',
        description: 'Premium aesthetic services and treatments',
      };

      const progress = getOrganizationSetupProgress(profile);
      
      expect(progress.completedSteps).toBe(7);
      expect(progress.totalSteps).toBe(7);
      expect(progress.completionPercentage).toBe(100);
    });
  });
});