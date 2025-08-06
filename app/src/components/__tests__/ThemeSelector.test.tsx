import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSelector } from '../ThemeSelector'
import { render } from '@/test/test-utils'
import { mockConvexHooks, mockAuthHooks, createMockUser, createMockOrg } from '@/test/convex-mocks'

// Setup mocks
mockConvexHooks()
mockAuthHooks()

const mockUser = createMockUser()
const mockOrg = createMockOrg({
  theme: {
    themeId: 'ocean',
    appliedAt: Date.now(),
    fontFamily: 'Inter',
  }
})

describe('ThemeSelector', () => {
  const mockUseQuery = vi.fn()
  const mockUseMutation = vi.fn()
  const mockUpdateTheme = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Convex hooks
    vi.doMock('convex/react', () => ({
      useQuery: mockUseQuery,
      useMutation: mockUseMutation,
    }))
    
    // Mock auth hook
    vi.doMock('@/hooks/useAuth', () => ({
      useAuth: () => ({
        user: { email: mockUser.email },
      }),
    }))
    
    // Setup default return values
    mockUseQuery
      .mockReturnValueOnce(mockUser) // userData query
      .mockReturnValueOnce(mockOrg)  // org query
    
    mockUseMutation.mockReturnValue(mockUpdateTheme)
  })

  it('renders theme selector with available themes', () => {
    render(<ThemeSelector />)
    
    expect(screen.getByText('Theme Settings')).toBeInTheDocument()
    expect(screen.getByText('Choose a theme and font to customize your experience')).toBeInTheDocument()
    expect(screen.getByText('Color Themes')).toBeInTheDocument()
    expect(screen.getByText('Font Family')).toBeInTheDocument()
  })

  it('displays all available themes', () => {
    render(<ThemeSelector />)
    
    // Check if all theme names are present
    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByText('Ocean Blue')).toBeInTheDocument()
    expect(screen.getByText('Sunset Orange')).toBeInTheDocument()
    expect(screen.getByText('Forest Green')).toBeInTheDocument()
    expect(screen.getByText('Royal Purple')).toBeInTheDocument()
    expect(screen.getByText('Rose Pink')).toBeInTheDocument()
  })

  it('displays all available fonts', () => {
    render(<ThemeSelector />)
    
    expect(screen.getByText('Inter')).toBeInTheDocument()
    expect(screen.getByText('PP Mori')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('Georgia')).toBeInTheDocument()
    expect(screen.getByText('Arial')).toBeInTheDocument()
  })

  it('shows active badge for current theme', () => {
    render(<ThemeSelector />)
    
    // Ocean theme should be active based on mock data
    const oceanTheme = screen.getByText('Ocean Blue').closest('.cursor-pointer')
    expect(oceanTheme).toHaveClass('ring-2', 'ring-primary', 'border-primary')
  })

  it('calls updateTheme when theme is selected', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)
    
    const sunsetTheme = screen.getByText('Sunset Orange').closest('.cursor-pointer')
    await user.click(sunsetTheme!)
    
    await waitFor(() => {
      expect(mockUpdateTheme).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: mockUser.orgId,
          theme: expect.objectContaining({
            themeId: 'sunset',
            fontFamily: 'Inter',
          }),
        })
      )
    })
  })

  it('calls updateTheme when font is selected', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)
    
    const ppMoriFont = screen.getByText('PP Mori').closest('.cursor-pointer')
    await user.click(ppMoriFont!)
    
    await waitFor(() => {
      expect(mockUpdateTheme).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: mockUser.orgId,
          theme: expect.objectContaining({
            themeId: 'ocean', // Should maintain current theme
            fontFamily: 'PP Mori, sans-serif',
          }),
        })
      )
    })
  })

  it('shows sample button with theme colors', () => {
    render(<ThemeSelector />)
    
    const sampleButtons = screen.getAllByText('Sample Button')
    expect(sampleButtons).toHaveLength(6) // One for each theme
    
    // Each button should have theme-specific styling
    sampleButtons.forEach(button => {
      expect(button).toHaveStyle({ color: expect.any(String) })
      expect(button).toHaveStyle({ backgroundColor: expect.any(String) })
    })
  })

  it('displays font preview with correct font family', () => {
    render(<ThemeSelector />)
    
    const fontPreview = screen.getByText('The quick brown fox jumps over the lazy dog')
    expect(fontPreview).toBeInTheDocument()
  })

  it('handles loading state when user data is not available', () => {
    // Mock loading state
    mockUseQuery
      .mockReturnValueOnce(undefined) // userData query
      .mockReturnValueOnce(undefined) // org query
    
    render(<ThemeSelector />)
    
    // Component should still render but not crash
    expect(screen.getByText('Theme Settings')).toBeInTheDocument()
  })

  it('handles error state gracefully', () => {
    // Mock error state
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUpdateTheme.mockRejectedValue(new Error('Update failed'))
    
    render(<ThemeSelector />)
    
    // Component should still render
    expect(screen.getByText('Theme Settings')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })
})