import { Suspense } from "react";
import { discoveryDay, getDiscoveryBatch } from "@/lib/discovery-products";
import { BrandLoader } from "@/components/ui/brand-loader";
import { DiscoveryProducts } from "./DiscoveryProducts";

async function DiscoveryContent() {
  const day = discoveryDay();
  try {
    const batch = await getDiscoveryBatch(1, day);
    return <DiscoveryProducts key={day} initialBatch={batch} day={day} />;
  } catch (error) {
    console.error("Error fetching initial discovery picks:", error);
    return <DiscoveryProducts key={day} day={day} initialBatch={null} />;
  }
}

export default function DiscoverySection() {
  return (
    <section aria-labelledby="discovery-title" className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
      <div className="mb-6 border-t border-border/60 pt-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0E5A43] dark:text-emerald-400">A little discovery, every day</p>
        <h2 id="discovery-title" className="text-xl font-semibold tracking-tight sm:text-2xl">Discover something new</h2>
        <p className="mt-2 text-sm text-muted-foreground">Fresh picks from different stores. Find your next favourite.</p>
      </div>
      <Suspense fallback={<div className="flex min-h-48 items-center justify-center"><BrandLoader size={80} /></div>}>
        <DiscoveryContent />
      </Suspense>
    </section>
  );
}
