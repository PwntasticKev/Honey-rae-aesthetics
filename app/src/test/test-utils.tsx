import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock Convex Provider
const MockConvexProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="convex-provider">{children}</div>
}

// Mock Environment Provider
const MockEnvironmentProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="environment-provider">{children}</div>
}

// Mock Error Boundary
const MockErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="error-boundary">{children}</div>
}

// All the providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockConvexProvider>
      <MockEnvironmentProvider>
        <MockErrorBoundary>
          {children}
        </MockErrorBoundary>
      </MockEnvironmentProvider>
    </MockConvexProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Test helpers
export const createMockProps = (overrides = {}) => ({
  className: 'test-class',
  'data-testid': 'test-component',
  ...overrides,
})

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock functions
export const createMockFunction = <T extends (...args: any[]) => any>(
  implementation?: T
) => {
  return vi.fn(implementation)
}

// Form testing helpers
export const fillForm = async (container: HTMLElement, formData: Record<string, string>) => {
  const userEvent = (await import('@testing-library/user-event')).default
  const user = userEvent.setup()
  
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = container.querySelector(`input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`)
    if (field) {
      await user.clear(field as HTMLElement)
      await user.type(field as HTMLElement, value)
    }
  }
}

export const submitForm = async (container: HTMLElement) => {
  const userEvent = (await import('@testing-library/user-event')).default
  const user = userEvent.setup()
  
  const submitButton = container.querySelector('button[type="submit"]') || 
                      container.querySelector('button:last-child')
  
  if (submitButton) {
    await user.click(submitButton as HTMLElement)
  }
}

// Assertion helpers
export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveClass(className)
}

// Loading state helpers
export const expectLoadingState = (container: HTMLElement) => {
  const loadingIndicator = container.querySelector('[data-testid="loading"]') || 
                          container.querySelector('.loading') ||
                          container.querySelector('[role="progressbar"]')
  expect(loadingIndicator).toBeInTheDocument()
}

export const expectErrorState = (container: HTMLElement, errorMessage?: string) => {
  const errorElement = container.querySelector('[data-testid="error"]') || 
                      container.querySelector('.error') ||
                      container.querySelector('[role="alert"]')
  expect(errorElement).toBeInTheDocument()
  
  if (errorMessage) {
    expect(errorElement).toHaveTextContent(errorMessage)
  }
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }