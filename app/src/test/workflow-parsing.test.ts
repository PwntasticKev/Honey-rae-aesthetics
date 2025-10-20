import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Workflow Components TypeScript Compilation', () => {
  it('should compile EnhancedWorkflowList without syntax errors', async () => {
    try {
      // Check if TypeScript can compile the file without errors
      const { stderr } = await execAsync('npx tsc --noEmit src/components/EnhancedWorkflowList.tsx', {
        cwd: process.cwd()
      });
      
      // Should not have any syntax errors
      expect(stderr).not.toContain('error TS');
      expect(stderr).not.toContain('Parsing ecmascript');
      expect(stderr).not.toContain('Unterminated');
    } catch (error: any) {
      // If compilation fails, fail the test with the error message
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  });

  it('should compile EnhancedWorkflowEditor without syntax errors', async () => {
    try {
      const { stderr } = await execAsync('npx tsc --noEmit src/components/EnhancedWorkflowEditor.tsx', {
        cwd: process.cwd()
      });
      
      expect(stderr).not.toContain('error TS');
      expect(stderr).not.toContain('Parsing ecmascript');
      expect(stderr).not.toContain('Unterminated');
    } catch (error: any) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  });

  it('should compile workflow pages without syntax errors', async () => {
    try {
      const { stderr } = await execAsync('npx tsc --noEmit src/app/workflows/page.tsx src/app/workflow-editor/page.tsx', {
        cwd: process.cwd()
      });
      
      expect(stderr).not.toContain('error TS');
      expect(stderr).not.toContain('Parsing ecmascript');
      expect(stderr).not.toContain('Unterminated');
    } catch (error: any) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  });
});