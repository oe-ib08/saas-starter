"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        ref={ref}
        {...props}
      />
      <div className={cn(
        "relative w-11 h-6 bg-muted rounded-full transition-colors duration-200 ease-in-out",
        "peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2",
        props.checked ? "bg-primary" : "bg-muted",
        className
      )}>
        <div className={cn(
          "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out",
          props.checked ? "translate-x-5" : "translate-x-0"
        )} />
      </div>
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }