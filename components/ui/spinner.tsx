import { BrandLoader } from "@/components/ui/brand-loader";

interface SpinnerProps { size?: "sm" | "md" | "lg"; className?: string }
export function Spinner({ size = "md", className }: SpinnerProps) {
  return <BrandLoader size={{ sm: 20, md: 32, lg: 64 }[size]} className={className} />;
}
export default Spinner;
