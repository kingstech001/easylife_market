import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | number;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

export function Spinner({ size = "md", className, style, "aria-label": label = "Loading" }: SpinnerProps) {
  const sizeClass = typeof size === "number" ? "" : { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  return <Loader2
    role="status"
    aria-label={label}
    className={cn("inline-block shrink-0 animate-spin motion-reduce:animate-none", sizeClass, className)}
    style={{ ...(typeof size === "number" ? { width: size, height: size } : {}), ...style }}
  />;
}
export default Spinner;
