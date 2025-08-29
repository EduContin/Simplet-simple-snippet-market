import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // GitHub-style flat card with exact border radius and colors
      "rounded-md border border-[--border-default] bg-[--canvas] text-[--fg-default] transition-colors duration-100 ease-in-out",
      // GitHub-style hover effect - subtle border color change only
      "hover:border-[--border-muted]",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // GitHub spacing: 16px padding with bottom border
      "flex flex-col space-y-1.5 p-4 border-b border-[--border-default] last:border-b-0 bg-[--canvas-subtle] first:rounded-t-md",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // GitHub typography: 14px, semi-bold, precise line height
      "text-sm font-semibold leading-5 tracking-normal text-[--fg-default] m-0",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      // GitHub muted text: 12px, normal weight
      "text-xs font-normal leading-4 text-[--fg-muted] mt-1",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // GitHub content spacing: 16px padding with proper spacing
      "p-4 space-y-3",
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // GitHub footer: flex layout with 16px padding and top border
      "flex items-center gap-3 p-4 border-t border-[--border-default] first:border-t-0 bg-[--canvas-subtle] last:rounded-b-md",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }