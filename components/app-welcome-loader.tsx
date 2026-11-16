"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BrandLoader } from "@/components/ui/brand-loader";

export function AppWelcomeLoader({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsVisible(false), 2000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
          <BrandLoader size={128} aria-label="Loading EasyLife" />
          {/* <p className="text-sm text-muted-foreground">Welcome to EasyLife</p> */}
        </div>
      )}
      {/* Keep the app mounted so its data can load during the welcome screen. */}
      <div style={{ display: isVisible ? "none" : "contents" }}>
        {children}
      </div>
    </>
  );
}
