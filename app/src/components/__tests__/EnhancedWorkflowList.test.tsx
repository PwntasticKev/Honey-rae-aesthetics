import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EnhancedWorkflowList } from '../EnhancedWorkflowList';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUser = {
  userId: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  orgId: 'org_123',
};

const mockDirectories = [
  {
    _id: 'dir_1',
    name: 'Marketing Workflows',
    parentId: undefined,
    description: 'Marketing related workflows',
    children: [
      {
        _id: 'dir_2',
        name: 'Email Campaigns',
        parentId: 'dir_1',
        description: 'Email marketing workflows',
        children: [],
      }
    ],
  },
];

const mockWorkflows = [
  {
    _id: 'workflow_1',
    name: 'Welcome Email Sequence',
    description: 'Send welcome emails to new clients',
    status: 'active',
    trigger: 'new_client',
    directoryId: 'dir_2',
    activeEnrollmentCount: 5,
    totalEnrollmentCount: 10,
    totalRuns: 25,
    successfulRuns: 23,
    createdAt: Date.now(),
  },
];

describe('EnhancedWorkflowList Drag and Drop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      orgId: mockUser.orgId,
      organization: { name: 'Test Org' },
      isLoading: false,
      isAuthenticated: true,
      sessionToken: 'token',
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      verifyOTP: vi.fn(),
      logout: vi.fn(),
      createAccount: vi.fn(),
    });

    // Mock Convex hooks
    const { useQuery, useMutation } = require('convex/react');
    useQuery.mockImplementation((api: any, args: any) => {
      if (api.toString().includes('getDirectories')) {
        return mockDirectories;
      }
      if (api.toString().includes('getWorkflows')) {
        return mockWorkflows;
      }
      return [];
    });

    useMutation.mockReturnValue(vi.fn());
  });

  it('should render directories in a tree structure', () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    expect(screen.getByText('Marketing Workflows')).toBeInTheDocument();
    expect(screen.getByText('Email Campaigns')).toBeInTheDocument();
  });

  it('should show drag over effect when dragging over a directory', async () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const directory = screen.getByText('Marketing Workflows').closest('div');
    expect(directory).toBeInTheDocument();

    // Simulate drag over
    fireEvent.dragOver(directory!, {
      dataTransfer: { effectAllowed: 'move' }
    });

    // Should add drag over styling
    expect(directory).toHaveClass('bg-blue-100', 'border-blue-300', 'border-dashed');
  });

  it('should show different styling when dragging over root directory', async () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const rootDirectory = screen.getByText('All Workflows').closest('div');
    expect(rootDirectory).toBeInTheDocument();

    // Simulate drag over root
    fireEvent.dragOver(rootDirectory!, {
      dataTransfer: { effectAllowed: 'move' }
    });

    // Should add green drag over styling for root
    expect(rootDirectory).toHaveClass('bg-green-100', 'border-green-300', 'border-dashed');
  });

  it('should handle directory drag start', () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const directory = screen.getByText('Marketing Workflows').closest('div');
    
    // Simulate drag start
    fireEvent.dragStart(directory!);

    // Directory should have opacity reduced
    expect(directory).toHaveClass('opacity-50');
  });

  it('should call moveDirectory mutation when dropping directory on another directory', async () => {
    const mockMoveDirectory = vi.fn();
    const { useMutation } = require('convex/react');
    useMutation.mockImplementation((api: any) => {
      if (api.toString().includes('moveDirectory')) {
        return mockMoveDirectory;
      }
      return vi.fn();
    });

    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const sourceDir = screen.getByText('Email Campaigns').closest('div');
    const targetDir = screen.getByText('Marketing Workflows').closest('div');

    // Simulate drag and drop
    fireEvent.dragStart(sourceDir!);
    fireEvent.dragOver(targetDir!);
    fireEvent.drop(targetDir!);

    await waitFor(() => {
      expect(mockMoveDirectory).toHaveBeenCalledWith({
        directoryId: 'dir_2',
        newParentId: 'dir_1',
      });
    });
  });

  it('should call moveDirectory with null newParentId when dropping on root', async () => {
    const mockMoveDirectory = vi.fn();
    const { useMutation } = require('convex/react');
    useMutation.mockImplementation((api: any) => {
      if (api.toString().includes('moveDirectory')) {
        return mockMoveDirectory;
      }
      return vi.fn();
    });

    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const sourceDir = screen.getByText('Email Campaigns').closest('div');
    const rootDir = screen.getByText('All Workflows').closest('div');

    // Simulate drag and drop to root
    fireEvent.dragStart(sourceDir!);
    fireEvent.dragOver(rootDir!);
    fireEvent.drop(rootDir!);

    await waitFor(() => {
      expect(mockMoveDirectory).toHaveBeenCalledWith({
        directoryId: 'dir_2',
        newParentId: null,
      });
    });
  });

  it('should show context menu when clicking directory options', () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const moreButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );
    
    expect(moreButton).toBeInTheDocument();
    fireEvent.click(moreButton!);
    
    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should open rename dialog when clicking rename option', () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const moreButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')?.classList.contains('lucide-more-horizontal')
    );
    
    fireEvent.click(moreButton!);
    fireEvent.click(screen.getByText('Rename'));
    
    expect(screen.getByText('Rename Directory')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new directory name')).toBeInTheDocument();
  });

  it('should open archive dialog when clicking archive button', () => {
    render(<EnhancedWorkflowList orgId="org_123" />);
    
    const archiveButton = screen.getByTitle('View Archive');
    fireEvent.click(archiveButton);
    
    expect(screen.getByText('Archived Directories')).toBeInTheDocument();
  });
});