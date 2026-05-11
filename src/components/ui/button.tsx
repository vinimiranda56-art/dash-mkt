import { Slot } from "@radix-ui/react-slot";
import { ChevronDown, type LucideIcon } from "lucide-react";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow,background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90 data-[state=open]:bg-primary/90",
        primary: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90 data-[state=open]:bg-primary/90",
        mono: "bg-zinc-950 text-white shadow-sm shadow-black/5 hover:bg-zinc-950/90 data-[state=open]:bg-zinc-950/90",
        destructive: "bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-600/90 data-[state=open]:bg-red-600/90",
        secondary: "bg-muted text-foreground shadow-sm hover:bg-muted/80",
        outline: "border border-border bg-background shadow-sm hover:bg-muted",
        dashed: "border border-dashed border-border bg-background text-foreground shadow-sm hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        dim: "text-muted-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        foreground: "text-foreground underline-offset-4 hover:underline",
      },
      mode: {
        default: "",
        icon: "",
        link: "h-auto rounded-none bg-transparent p-0 shadow-none hover:bg-transparent",
        input: "justify-start border border-input bg-background font-normal hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/30",
      },
      appearance: {
        default: "",
        ghost: "bg-transparent shadow-none",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
      size: {
        default: "h-9 gap-2 px-4 py-2 [&_svg:not([class*=size-])]:size-4",
        md: "h-9 gap-2 px-3 [&_svg:not([class*=size-])]:size-4",
        sm: "h-8 gap-1.5 px-2.5 text-xs [&_svg:not([class*=size-])]:size-3.5",
        lg: "h-10 gap-2 px-4 [&_svg:not([class*=size-])]:size-4",
        icon: "size-9 p-0 [&_svg:not([class*=size-])]:size-4",
      },
      placeholder: {
        true: "text-muted-foreground",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        appearance: "ghost",
        className: "bg-transparent text-primary hover:bg-primary/5",
      },
      {
        variant: "destructive",
        appearance: "ghost",
        className: "bg-transparent text-red-600 hover:bg-red-50",
      },
      {
        variant: "ghost",
        mode: "icon",
        className: "text-muted-foreground",
      },
      {
        mode: "link",
        variant: "foreground",
        className: "font-medium",
      },
      {
        mode: "input",
        placeholder: true,
        variant: "outline",
        className: "text-muted-foreground",
      },
    ],
    defaultVariants: {
      variant: "default",
      mode: "default",
      appearance: "default",
      shape: "default",
      size: "md",
      placeholder: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  selected?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      mode,
      appearance,
      shape,
      size,
      placeholder,
      selected,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-state={selected ? "open" : undefined}
        className={cn(
          buttonVariants({
            variant,
            mode,
            appearance,
            shape,
            size,
            placeholder,
            className,
          }),
          asChild && props.disabled && "pointer-events-none opacity-50",
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
  icon?: LucideIcon;
}

function ButtonArrow({
  icon: Icon = ChevronDown,
  className,
  ...props
}: ButtonArrowProps) {
  return <Icon data-slot="button-arrow" className={cn("ms-auto -me-1", className)} {...props} />;
}

export { Button, ButtonArrow, buttonVariants };
