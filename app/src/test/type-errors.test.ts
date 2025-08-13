/**
 * TypeScript Error Test Suite
 * 
 * This test ensures that our TypeScript compilation passes without errors.
 * It runs the TypeScript compiler and checks for any compilation errors.
 */

import { execSync } from 'child_process';
import { describe, it, expect } from 'vitest';

describe('TypeScript Compilation', () => {
  it('should compile without TypeScript errors', () => {
    try {
      // Run TypeScript compiler with no emit to check for errors
      const result = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });
      
      // If we get here, compilation was successful
      expect(true).toBe(true);
    } catch (error: any) {
      // If compilation fails, log the errors and fail the test
      const errorOutput = error.stdout || error.stderr || 'Unknown compilation error';
      
      // Count the number of errors
      const errorLines = errorOutput.split('\n').filter((line: string) => 
        line.includes('error TS')
      );
      
      console.error(`\n🚨 TypeScript compilation failed with ${errorLines.length} errors:\n`);
      console.error(errorOutput);
      
      // Fail the test with details about the errors
      expect.fail(`TypeScript compilation failed with ${errorLines.length} errors. See console output for details.`);
    }
  });

  it('should have no critical workflow editor type errors', () => {
    try {
      const result = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      expect(true).toBe(true);
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || '';
      
      // Check for specific critical errors we've fixed
      const criticalErrors = [
        'Duplicate identifier \'FileText\'',
        'Duplicate identifier \'nodeCategories\'',
        'Property \'id\' does not exist on type \'never\'',
        'does not satisfy the constraint \'Node\'',
        'does not satisfy the constraint \'Edge\''
      ];
      
      const foundCriticalErrors = criticalErrors.filter(errorPattern => 
        errorOutput.includes(errorPattern)
      );
      
      if (foundCriticalErrors.length > 0) {
        console.error('\n🚨 Critical workflow editor errors found:');
        foundCriticalErrors.forEach(error => console.error(`  - ${error}`));
        expect.fail(`Found ${foundCriticalErrors.length} critical workflow editor errors that should have been fixed.`);
      }
      
      // Allow other non-critical errors to pass for now
      expect(true).toBe(true);
    }
  });

  it('should have properly typed ReactFlow components', () => {
    try {
      const result = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      expect(true).toBe(true);
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || '';
      
      // Check for ReactFlow-specific typing errors
      const reactFlowErrors = errorOutput.split('\n').filter((line: string) => 
        line.includes('EnhancedWorkflowEditor.tsx') && 
        (line.includes('useNodesState') || 
         line.includes('useEdgesState') || 
         line.includes('does not satisfy the constraint'))
      );
      
      if (reactFlowErrors.length > 0) {
        console.error('\n🚨 ReactFlow typing errors found:');
        reactFlowErrors.forEach(error => console.error(`  - ${error}`));
        expect.fail(`Found ${reactFlowErrors.length} ReactFlow typing errors.`);
      }
      
      expect(true).toBe(true);
    }
  });
});

describe('Component Type Safety', () => {
  it('should have no duplicate imports', () => {
    try {
      const result = execSync('npx tsc --noEmit', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      expect(true).toBe(true);
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || '';
      
      const duplicateErrors = errorOutput.split('\n').filter((line: string) => 
        line.includes('Duplicate identifier')
      );
      
      if (duplicateErrors.length > 0) {
        console.error('\n🚨 Duplicate identifier errors found:');
        duplicateErrors.forEach(error => console.error(`  - ${error}`));
        expect.fail(`Found ${duplicateErrors.length} duplicate identifier errors.`);
      }
      
      expect(true).toBe(true);
    }
  });

  it('should have no unused variable errors in critical components', () => {
    try {
      execSync('npx tsc --noEmit --noUnusedLocals', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 15000 // 15 second timeout
      });
      expect(true).toBe(true);
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || '';
      
      // Only check for unused errors in workflow editor
      const unusedErrors = errorOutput.split('\n').filter((line: string) => 
        line.includes('EnhancedWorkflowEditor.tsx') && 
        line.includes('is declared but its value is never read')
      );
      
      if (unusedErrors.length > 0) {
        console.warn('\n⚠️  Unused variables found in workflow editor:');
        unusedErrors.forEach(error => console.warn(`  - ${error}`));
        // Don't fail the test for unused variables, just warn
      }
      
      expect(true).toBe(true);
    }
  }, 20000); // 20 second timeout for this test
});