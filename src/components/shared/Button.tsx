"use client";

import * as React from "react";
import { 
  Button as ShadcnButton,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Custom Button component that wraps Shadcn/Radix UI Button
 * with additional functionality like fullWidth and icon support.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    fullWidth = false,
    icon,
    iconPosition = "left",
    children,
    ...props 
  }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          // Add custom styles
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="ml-2">{icon}</span>
        )}
      </ShadcnButton>
    );
  }
);

Button.displayName = "Button";

export default Button; 