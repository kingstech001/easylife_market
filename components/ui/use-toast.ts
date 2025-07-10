// components/ui/use-toast.ts

import { toast as sonnerToast } from "sonner";

// Optional: Named export for direct use
export const toast = sonnerToast;

// Hook-based usage
export function useToast() {
  return {
    toast: sonnerToast,
    dismiss: sonnerToast.dismiss,
  };
}
