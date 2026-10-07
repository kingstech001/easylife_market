"use client";

import { useEffect, useState } from "react";
import { getStoreStatus, type BusinessHours } from "@/lib/store-hours";
import { cn } from "@/lib/utils";

/**
 * Open/closed status, computed in the browser and refreshed every minute.
 *
 * Why client-side: if the server computed it, the page would have to be rendered
 * on every request (it can't be cached), and a server in UTC would also get the
 * hour wrong for a store in Nigeria. This lets the store page be cached at the CDN.
 */
export function LiveStoreStatus({
  businessHours,
  className,
}: {
  businessHours?: BusinessHours | null;
  className?: string;
}) {
  const [status, setStatus] = useState<ReturnType<typeof getStoreStatus> | null>(
    null,
  );

  useEffect(() => {
    const update = () => setStatus(getStoreStatus(businessHours));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [businessHours]);

  if (!status) {
    return (
      <span
        aria-hidden
        className={cn("inline-block h-4 w-36 animate-pulse rounded bg-muted", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span
        aria-hidden
        className={cn(
          "h-2 w-2 rounded-full",
          status.isOpen ? "bg-green-500" : "bg-red-500",
        )}
      />
      <span
        className={cn(
          "font-medium",
          status.isOpen
            ? "text-[#0E5A43] dark:text-emerald-400"
            : "text-red-600 dark:text-red-400",
        )}
      >
        {status.isOpen ? "Open" : "Closed"}
      </span>
      <span className="text-muted-foreground">· {status.detail}</span>
    </span>
  );
}