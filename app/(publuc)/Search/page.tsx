import { Suspense } from "react";
import SearchResultsPage from "@/components/Searchresultspage";
import { CategorySidebar } from "@/components/CategoryGrid";
import { Search } from "lucide-react";

export const metadata = {
  title: "Search Results | EasyLife",
  description: "Search for products across all stores on EasyLife marketplace",
};

function SearchLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Loading search...</h3>
          <p className="text-sm text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop only */}
      <CategorySidebar />

      {/* Main Content */}
      <main className="flex-1">
        <Suspense fallback={<SearchLoading />}>
          <SearchResultsPage />
        </Suspense>
      </main>
    </div>
  );
}