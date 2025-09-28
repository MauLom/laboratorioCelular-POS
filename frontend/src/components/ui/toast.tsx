"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simplified toast component for basic functionality
interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: "default" | "destructive"
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, action, open = true, onOpenChange, ...props }, ref) => {
    if (!open) return null;

    const variantClasses = {
      default: "border bg-white text-gray-900 shadow-lg",
      destructive: "border-red-500 bg-red-50 text-red-900",
    }

    const handleClose = () => {
      if (onOpenChange) {
        onOpenChange(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && (
            <div className="text-sm font-semibold">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        {action && action}
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>
    )
  }
)
Toast.displayName = "Toast"

// Toast viewport for positioning
const ToastViewport = React.forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

export { Toast, ToastViewport }