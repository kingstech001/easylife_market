"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Optional helper for merging classNames (if you have it)

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className }) => {
  const sizeClasses =
    size === "sm"
      ? "h-4 w-4 border-2"
      : size === "lg"
      ? "h-10 w-10 border-4"
      : "h-6 w-6 border-2";

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-primary",
        sizeClasses,
        className
      )}
      role="status"
      aria-label="loading"
    />
  );
};

export default Spinner;
