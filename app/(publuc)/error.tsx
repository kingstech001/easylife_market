"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Public route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected error loading this page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()} className="rounded-xl h-10">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Go Back
          </Button>
          <Button onClick={reset} className="rounded-xl h-10">
            <RotateCcw className="mr-1.5 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
