import { Spinner } from "@/components/ui/spinner";
// components/NewProductsLoading.tsx

// Mirrors NewProductsClient (same container, header row, grid and card shape)
// so nothing shifts when the real products stream in.
export function NewProductsLoading() {
  return <div className="flex min-h-48 items-center justify-center p-6"><Spinner size={32} /></div>;
}