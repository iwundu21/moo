
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_4px_0_0_hsl(260,80%,45%)] active:translate-y-1 active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-[0_4px_0_0_hsl(var(--border))] active:translate-y-1 active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "achievement-card":
          "bg-[--achievement-color] text-white shadow-[0_4px_0_0_hsl(var(--achievement-color-darker,0,0%,0%))] active:translate-y-1 active:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const customStyle = { ...style } as React.CSSProperties;

    if (variant === 'achievement-card' && typeof customStyle['--achievement-color'] === 'string') {
        const color = customStyle['--achievement-color'];
        const darkerColor = color.replace(/(\d+%)\)/, (match, p1) => `${parseFloat(p1) - 10}%)`);
        customStyle['--achievement-color-darker'] = darkerColor;
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={customStyle}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
