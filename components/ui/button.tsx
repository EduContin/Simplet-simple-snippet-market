import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-primary border border-primary/20 text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm",
        destructive:
          "bg-destructive border border-destructive/20 text-destructive-foreground hover:bg-destructive/90 rounded-md shadow-sm",
        outline:
          "border border-border-default bg-canvas text-fg-default hover:bg-canvas-subtle rounded-md",
        secondary:
          "bg-canvas-subtle border border-border-default text-fg-default hover:bg-canvas-inset rounded-md",
        ghost: "hover:bg-canvas-subtle text-fg-default rounded-md",
        link: "text-primary hover:underline underline-offset-4",
      },
      size: {
        default: "h-8 px-3 py-1",
        sm: "h-7 px-2 text-xs",
        lg: "h-10 px-4 py-2",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 