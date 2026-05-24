"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Dashboard Error</h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong loading this section.
        </p>
        <Button onClick={reset} className="rounded-xl h-10">
          <RotateCcw className="mr-1.5 h-4 w-4" /> Try Again
        </Button>
      </div>
    </div>
  );
}
