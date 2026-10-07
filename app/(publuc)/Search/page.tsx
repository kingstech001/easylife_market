// app/Search/page.tsx  (Server Component)

import { Suspense } from "react";
import { CategorySidebar } from "@/components/CategoryGrid";
import { SearchToolbar } from "@/components/SearchToolbar";
import {
  SearchResultsClient,
  SearchResultsSkeleton,
} from "@/components/Searchresultspage";
import { searchProducts, SEARCH_PAGE_SIZE } from "@/lib/search-products";

export const metadata = {
  title: "Search Results | EasyLife",
  description: "Search for products across all stores on EasyLife marketplace",
};

type SearchParams = {
  search?: string;
  q?: string;
  category?: string | string[];
};

// Fetches the first page on the server, so products arrive with the HTML
// instead of after "download JS → hydrate → fetch → filter".
async function SearchResults({
  query,
  categories,
}: {
  query: string;
  categories: string[];
}) {
  let initial: Awaited<ReturnType<typeof searchProducts>> | null = null;
  let failed = false;

  try {
    initial = await searchProducts({
      q: query,
      categories,
      page: 1,
      limit: SEARCH_PAGE_SIZE,
    });
  } catch (error) {
    console.error("[Search] Failed to load products:", error);
    failed = true;
  }

  return (
    <SearchResultsClient
      query={query}
      categories={categories}
      initialProducts={initial?.products ?? []}
      initialHasMore={initial?.hasMore ?? false}
      failed={failed}
    />
  );
}

export default async function SearchPage({
  searchParams,
}: {
  // Promise in Next 15+, plain object in Next 14: `await` handles both
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const sp = await searchParams;

  const query = (sp.search || sp.q || "").trim().slice(0, 100);
  const categories = ([] as string[]).concat(sp.category ?? []).slice(0, 40);
  const key = JSON.stringify([query, categories]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] items-start gap-6 lg:px-6 lg:pt-6">
      {/* Sidebar: desktop only (hides itself below lg) */}
      <CategorySidebar />

      <main className="min-w-0 flex-1">
        {/* Outside Suspense, so the search box never disappears while results load */}
        <SearchToolbar query={query} categories={categories} />

        {/* key forces the skeleton to show again whenever the search changes */}
        <Suspense key={key} fallback={<SearchResultsSkeleton />}>
          <SearchResults query={query} categories={categories} />
        </Suspense>
      </main>
    </div>
  );
}