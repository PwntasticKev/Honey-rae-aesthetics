// Consistent CSS class utilities for Honey Rae Aesthetics
// Use these instead of hardcoded Tailwind classes for better consistency

export const styles = {
  // Layout components
  page: {
    container: "min-h-screen bg-white",
    main: "flex-1",
    content: "p-6 bg-gray-50"
  },

  // Header components
  header: {
    container: "bg-white border-b border-gray-200 shadow-sm",
    content: "flex items-center justify-between pl-0 pr-6 h-16",
    title: "text-xl font-bold text-gray-900",
    subtitle: "text-sm text-gray-600"
  },

  // Sidebar components
  sidebar: {
    container: "fixed left-0 top-0 z-40 h-full w-48 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
    header: "flex items-center px-4 py-5 border-b border-gray-200",
    nav: "flex-1 px-3 py-4 space-y-1 overflow-y-auto",
    navItem: {
      base: "w-full flex items-center justify-between px-3 py-2.5 text-left transition-all duration-200 group cursor-pointer rounded-md",
      active: "bg-gray-100 text-gray-900 font-medium",
      inactive: "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }
  },

  // Card components
  card: {
    container: "bg-white rounded-lg border border-gray-200 shadow-sm",
    header: "p-6 border-b border-gray-200",
    content: "p-6",
    title: "text-lg font-semibold text-gray-900",
    description: "text-sm text-gray-600"
  },

  // Button components
  button: {
    primary: "bg-gray-900 text-white hover:bg-gray-800",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
  },

  // Form components
  input: {
    base: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400",
    error: "border-red-300 focus:ring-red-200 focus:border-red-400"
  },

  // Avatar components
  avatar: {
    fallback: "bg-gray-100 text-gray-900",
    image: "w-8 h-8"
  },

  // Badge components
  badge: {
    primary: "bg-gray-900 text-white",
    secondary: "bg-gray-100 text-gray-900",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800"
  },

  // Text utilities
  text: {
    primary: "text-gray-900",
    secondary: "text-gray-600", 
    tertiary: "text-gray-500",
    heading: "font-semibold text-gray-900",
    body: "text-gray-700",
    caption: "text-xs text-gray-500"
  },

  // State utilities
  states: {
    hover: "hover:bg-gray-50",
    active: "bg-gray-100",
    focus: "focus:outline-none focus:ring-2 focus:ring-gray-200",
    disabled: "opacity-50 cursor-not-allowed"
  }
};

// Utility function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Component-specific utilities
export const getButtonClasses = (variant: keyof typeof styles.button = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm", 
    lg: "px-6 py-3 text-base"
  };
  
  return cn(baseClasses, styles.button[variant], sizeClasses[size]);
};

export const getCardClasses = (variant: 'default' | 'elevated' = 'default') => {
  const base = styles.card.container;
  const elevated = variant === 'elevated' ? 'shadow-md' : '';
  
  return cn(base, elevated);
};