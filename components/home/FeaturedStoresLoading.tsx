import { Spinner } from "@/components/ui/spinner";
// components/home/FeaturedStoresLoading.tsx

// Mirrors the real carousel (same section padding, card widths and banner
// heights) so nothing jumps when the real content streams in.
export function FeaturedStoresLoading() {
  return <div className="flex min-h-48 items-center justify-center p-6"><Spinner size={32} /></div>;
}