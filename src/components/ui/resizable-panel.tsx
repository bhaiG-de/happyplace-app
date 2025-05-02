"use client"

import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "@/lib/utils"

function ResizablePanel({
  className,
  children,
  defaultSize,
  ...props
}: ResizablePrimitive.PanelProps) {
  return (
    <ResizablePrimitive.Panel
      defaultSize={defaultSize}
      className={cn(className)}
      {...props}
    >
      {children}
    </ResizablePrimitive.Panel>
  )
}

export { ResizablePanel } 