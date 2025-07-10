// components/ui/toaster.tsx
"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      theme="light" // or "dark" if using dark mode
    />
  )
}
