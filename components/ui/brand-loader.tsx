import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type BrandLoaderProps = {
  className?: string;
  size?: number;
  style?: CSSProperties;
  "aria-label"?: string;
};

/** A compact version also fits inside buttons without changing their height. */
export function BrandLoader({
  className,
  size,
  style,
  "aria-label": label = "Loading",
}: BrandLoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("brand-loader inline-flex h-16 w-16 shrink-0 flex-col items-center justify-center align-middle", className)}
      style={{ ...(size ? { width: size, height: size } : {}), ...style }}
    >
      {/* A plain image keeps this tiny local asset available without an optimizer request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={64} height={64} className="brand-loader-logo h-[78%] w-[78%] object-contain" />
      <span aria-hidden="true" className="flex h-[16%] w-full items-center justify-center gap-[7%]">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="brand-loader-dot aspect-square w-[8%] rounded-full bg-[#0E5A43] dark:bg-emerald-400" style={{ animationDelay: `${dot * 150}ms` }} />
        ))}
      </span>
    </span>
  );
}
