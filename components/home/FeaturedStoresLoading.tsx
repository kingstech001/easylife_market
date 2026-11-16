import { BrandLoader } from "@/components/ui/brand-loader";
// components/home/FeaturedStoresLoading.tsx

// Mirrors the real carousel (same section padding, card widths and banner
// heights) so nothing jumps when the real content streams in.
export function FeaturedStoresLoading() {
  return <div className="flex min-h-48 items-center justify-center p-6"><BrandLoader size={80} /></div>;
}