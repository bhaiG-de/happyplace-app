"use client";

import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  error?: string;
}

/**
 * Custom Input component that wraps Shadcn/Radix UI Input 
 * with additional functionality like fullWidth and icon support.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    fullWidth = false,
    icon,
    iconPosition = "left",
    error,
    ...props 
  }, ref) => {
    return (
      <div className="relative w-full">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}

        <ShadcnInput
          ref={ref}
          className={cn(
            // Add custom styles
            fullWidth && "w-full",
            icon && iconPosition === "left" && "pl-10",
            icon && iconPosition === "right" && "pr-10",
            error && "border-error focus-visible:ring-error/25",
            className
          )}
          {...props}
        />

        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input; 