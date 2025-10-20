// Global theme configuration for Honey Rae Aesthetics
// Ensures consistent styling across all components

export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9', 
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      900: '#0f172a'
    },
    
    // Gray scale for UI elements
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Background colors
    background: '#ffffff',
    surface: '#ffffff',
    
    // Text colors
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af'
    }
  },

  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
  },

  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  }
};

// Common component styles
export const commonStyles = {
  // Card styles
  card: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.gray[200]}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.sm,
    padding: theme.spacing['2xl']
  },

  // Button styles
  button: {
    primary: {
      background: theme.colors.gray[900],
      color: theme.colors.background,
      hover: theme.colors.gray[800]
    },
    secondary: {
      background: theme.colors.gray[100],
      color: theme.colors.gray[900],
      hover: theme.colors.gray[200]
    }
  },

  // Input styles
  input: {
    background: theme.colors.background,
    border: `1px solid ${theme.colors.gray[300]}`,
    borderRadius: theme.borderRadius.md,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    focus: {
      borderColor: theme.colors.gray[400],
      boxShadow: `0 0 0 3px ${theme.colors.gray[100]}`
    }
  }
};

// Utility functions for theme
export const getTextColor = (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
  return theme.colors.text[variant];
};

export const getGrayColor = (shade: keyof typeof theme.colors.gray) => {
  return theme.colors.gray[shade];
};

export const getSpacing = (size: keyof typeof theme.spacing) => {
  return theme.spacing[size];
};