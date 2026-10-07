"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, buildCategorySearchUrl } from "@/components/CategoryGrid";

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export function SearchToolbar({
  query,
  categories,
}: {
  query: string;
  categories: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(query);

  // Keep the input in sync when the URL changes (back button, category click…)
  useEffect(() => {
    setValue(query);
  }, [query]);

  const activeCategory = CATEGORIES.find(
    (c) => c.name.toLowerCase() === categories[0]?.toLowerCase(),
  );
  const hasFilter = !!query || categories.length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/Search?search=${encodeURIComponent(q)}` : "/Search");
    inputRef.current?.blur();
  };

  return (
    <>
      {/* Sticky search */}
      <div className="sticky top-14 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="px-4 py-3 sm:px-6 lg:px-0">
          <form onSubmit={onSubmit} role="search" className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search products and stores"
              aria-label="Search products and stores"
              className="h-11 w-full rounded-xl border border-border bg-muted/40 pl-10 pr-28 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-[#0E5A43] focus:bg-background focus:ring-4 focus:ring-[#0E5A43]/10 sm:text-sm"
            />
            {value && (
              <button
                type="button"
                aria-label="Clear search text"
                onClick={() => {
                  setValue("");
                  inputRef.current?.focus();
                }}
                className="absolute right-[5.25rem] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-[#0E5A43] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#083B2D]"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Category chips (the sidebar covers this on desktop) */}
      <nav aria-label="Categories" className="px-4 pt-5 sm:px-6 lg:hidden">
        <ul
          className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 ${hideScrollbar}`}
        >
          <li className="shrink-0">
            <Link
              href="/Search"
              aria-current={!hasFilter ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                !hasFilter
                  ? "border-transparent bg-[#0E5A43] text-white"
                  : "border-border bg-background text-foreground/80 hover:border-[#0E5A43] hover:text-[#0E5A43]",
              )}
            >
              All
            </Link>
          </li>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = !query && activeCategory?.name === cat.name;
            return (
              <li key={cat.name} className="shrink-0">
                <Link
                  href={buildCategorySearchUrl(cat)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border pl-3 pr-3.5 text-sm font-medium transition-colors",
                    active
                      ? "border-transparent bg-[#0E5A43] text-white"
                      : "border-border bg-background text-foreground/80 hover:border-[#0E5A43] hover:text-[#0E5A43]",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}