import React from "react";
import { AlertTriangle, X, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type ErrorAlertVariant = "error" | "warning" | "info" | "success";

interface ErrorAlertProps {
  variant?: ErrorAlertVariant;
  title: string;
  message?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

const variantStyles: Record<ErrorAlertVariant, {
  container: string;
  icon: string;
  title: string;
  message: string;
  iconComponent: React.ComponentType<{ className?: string }>;
}> = {
  error: {
    container: "bg-red-50 border-red-200 border",
    icon: "text-red-500",
    title: "text-red-800 font-semibold",
    message: "text-red-700",
    iconComponent: AlertTriangle,
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 border",
    icon: "text-yellow-500",
    title: "text-yellow-800 font-semibold",
    message: "text-yellow-700",
    iconComponent: AlertTriangle,
  },
  info: {
    container: "bg-blue-50 border-blue-200 border",
    icon: "text-blue-500",
    title: "text-blue-800 font-semibold",
    message: "text-blue-700",
    iconComponent: Info,
  },
  success: {
    container: "bg-green-50 border-green-200 border",
    icon: "text-green-500",
    title: "text-green-800 font-semibold",
    message: "text-green-700",
    iconComponent: CheckCircle,
  },
};

export function ErrorAlert({
  variant = "error",
  title,
  message,
  children,
  onDismiss,
  className,
  actions,
}: ErrorAlertProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={cn(
        "rounded-lg p-4",
        styles.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={cn("h-5 w-5", styles.icon)} />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-sm", styles.title)}>
              {title}
            </h3>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className={cn(
                  "h-6 w-6 p-0 ml-2",
                  variant === "error" && "hover:bg-red-100",
                  variant === "warning" && "hover:bg-yellow-100",
                  variant === "info" && "hover:bg-blue-100",
                  variant === "success" && "hover:bg-green-100"
                )}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            )}
          </div>
          {message && (
            <p className={cn("mt-1 text-sm", styles.message)}>
              {message}
            </p>
          )}
          {children && (
            <div className={cn("mt-2 text-sm", styles.message)}>
              {children}
            </div>
          )}
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Convenience components for specific error types
export function ValidationError({ 
  errors, 
  onDismiss,
  className 
}: { 
  errors: string[]; 
  onDismiss?: () => void;
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <ErrorAlert
      variant="error"
      title="Validation Error"
      onDismiss={onDismiss}
      className={className}
    >
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </ErrorAlert>
  );
}

export function WarningAlert({ 
  warnings, 
  onDismiss,
  className 
}: { 
  warnings: string[]; 
  onDismiss?: () => void;
  className?: string;
}) {
  if (warnings.length === 0) return null;

  return (
    <ErrorAlert
      variant="warning"
      title="Recommendations"
      onDismiss={onDismiss}
      className={className}
    >
      <ul className="list-disc list-inside space-y-1">
        {warnings.map((warning, index) => (
          <li key={index}>{warning}</li>
        ))}
      </ul>
    </ErrorAlert>
  );
}