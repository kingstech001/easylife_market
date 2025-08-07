"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    // Handle controlled/uncontrolled state similar to Input
    const isControlled = value !== undefined
    const hasOnChange = onChange !== undefined

    const textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      ),
      ...props,
    }

    if (isControlled) {
      textareaProps.value = value
      if (hasOnChange) {
        textareaProps.onChange = onChange
      } else {
        textareaProps.readOnly = true
      }
    } else {
      textareaProps.onChange = onChange
    }

    return <textarea ref={ref} {...textareaProps} />
  },
)
Textarea.displayName = "Textarea"

export { Textarea }
