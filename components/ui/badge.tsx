import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border text-xs font-medium leading-4 transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-[--border-default] bg-[--canvas-subtle] text-[--fg-muted] px-2 py-0.5",
        secondary:
          "border-[--border-default] bg-[--canvas] text-[--fg-muted] px-2 py-0.5",
        destructive:
          "border-[rgba(248,81,73,0.4)] bg-[rgba(248,81,73,0.1)] text-[--destructive] px-2 py-0.5",
        success:
          "border-[rgba(63,185,80,0.4)] bg-[rgba(63,185,80,0.1)] text-[--success] px-2 py-0.5",
        warning:
          "border-[rgba(210,153,34,0.4)] bg-[rgba(210,153,34,0.1)] text-[--warning] px-2 py-0.5",
        outline:
          "border-[--border-default] text-[--fg-muted] bg-transparent px-2 py-0.5",
        dot:
          "border-[--border-default] bg-[--canvas-subtle] text-[--fg-muted] px-1.5 py-0.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 