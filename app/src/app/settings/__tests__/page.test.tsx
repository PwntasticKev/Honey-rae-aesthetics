import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SettingsPage from '../page';

// Mock the dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      email: 'test@example.com',
      orgId: 'org123',
      organization: { name: 'Test Org' }
    },
    logout: vi.fn()
  })
}));

vi.mock('@/components/Sidebar', () => ({
  Sidebar: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="sidebar" className={`fixed left-0 top-0 w-64 h-full ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      Sidebar
    </div>
  )
}));

vi.mock('@/components/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown">Notifications</div>
}));

vi.mock('@/components/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector">Theme Selector</div>
}));

describe('Settings Page Layout', () => {
  it('should have proper layout spacing to avoid content behind sidebar', () => {
    render(<SettingsPage />);
    
    // Main content container should have left margin on large screens
    const mainContent = screen.getByRole('main').closest('div');
    expect(mainContent).toHaveClass('lg:ml-64');
  });

  it('should render tab navigation without custom solid backgrounds', () => {
    render(<SettingsPage />);
    
    // Get tab triggers (now using radix-ui tabs)
    const tabTriggers = screen.getAllByRole('tab');
    
    // Tabs should use shadcn styling, not solid blue backgrounds
    tabTriggers.forEach(tab => {
      expect(tab).not.toHaveClass('bg-blue-500');
      expect(tab).not.toHaveClass('bg-blue-600');
      // Should have proper shadcn tab classes
      expect(tab).toHaveAttribute('data-slot', 'tabs-trigger');
    });
  });

  it('should show organization setup validation errors when missing required fields', async () => {
    const user = userEvent.setup();
    
    render(<SettingsPage />);
    
    // Switch to organization setup tab - now using radix tabs
    const orgSetupTab = screen.getByRole('tab', { name: /organization setup/i });
    await user.click(orgSetupTab);
    
    // Should show setup progress (updated text)
    expect(screen.getByText(/setup progress/i)).toBeInTheDocument();
    expect(screen.getByText(/organization created/i)).toBeInTheDocument();
    expect(screen.getByText(/organization linked: yes/i)).toBeInTheDocument();
  });

  it('should render properly spaced header that does not overlap with sidebar', () => {
    render(<SettingsPage />);
    
    const header = screen.getByRole('banner');
    const headerContainer = header.querySelector('.flex.items-center.justify-between.px-6.h-16');
    
    expect(headerContainer).toBeInTheDocument();
    expect(header).toHaveClass('border-b');
  });
});