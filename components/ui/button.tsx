import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-medium transition-all duration-75 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none appearance-none text-decoration-none vertical-align-middle",
  {
    variants: {
      variant: {
        default: "text-white bg-[--btn-primary-bg] border border-[rgba(47,129,247,0.4)] hover:bg-[--btn-primary-hover-bg] active:bg-[--btn-primary-active-bg] focus:outline-2 focus:outline-[--focus-outlineColor] focus:outline-offset-[-2px] shadow-[0_1px_0_rgba(27,31,36,0.04),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_1px_0_rgba(27,31,36,0.04),inset_0_1px_0_rgba(255,255,255,0.25)] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.15)]",
        destructive:
          "text-white bg-[--destructive] border border-[rgba(248,81,73,0.4)] hover:bg-[#e5484d] active:bg-[#dc3d43] focus:outline-2 focus:outline-[--focus-outlineColor] focus:outline-offset-[-2px] shadow-[0_1px_0_rgba(27,31,36,0.04),inset_0_1px_0_rgba(255,255,255,0.25)]",
        outline:
          "text-[--fg-default] bg-[--canvas] border border-[--border-default] hover:bg-[--canvas-subtle] active:bg-[--canvas-inset] focus:outline-2 focus:outline-[--focus-outlineColor] focus:outline-offset-[-2px] shadow-[0_1px_0_rgba(27,31,36,0.04),inset_0_1px_0_rgba(255,255,255,0.25)]",
        secondary:
          "text-[--fg-default] bg-[--btn-secondary-bg] border border-[--btn-secondary-border] hover:bg-[--btn-secondary-hover-bg] focus:outline-2 focus:outline-[--focus-outlineColor] focus:outline-offset-[-2px] shadow-[0_1px_0_rgba(27,31,36,0.04),inset_0_1px_0_rgba(255,255,255,0.25)]",
        ghost: "text-[--fg-default] hover:bg-[--canvas-subtle] active:bg-[--canvas-inset]",
        link: "text-[--accent] hover:underline underline-offset-4",
      },
      size: {
        default: "h-10 px-5 py-2 text-base leading-6",
        sm: "h-8 px-4 py-1.5 text-sm leading-5",
        lg: "h-12 px-6 py-3 text-base leading-6",
        icon: "h-10 w-10 p-0",
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