import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Box & layout
        "h-9 w-full min-w-0 rounded-lg px-2.5 py-1 text-sm transition-colors outline-none",
        // Fill & border — high enough contrast to read as a clickable field on both
        // light cards (#fff) and dark cards (#181830) regardless of accent.
        "border border-foreground/15 bg-foreground/[0.04]",
        // Focus state — lift to the card surface so the field "opens" + accent border + ring.
        "focus-visible:bg-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        // File input button
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Placeholder
        "placeholder:text-muted-foreground",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Validation
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
