// components/Category.tsx

import { CategoryGrid, CategorySidebar } from "../CategoryGrid";
import NewProductsSection from "../NewProductsSection";
// import NewProductsSection from "./NewProductsSection";

function Category() {
  return (
    <div>
      <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-[#0E5A43]">
                  New{" "}
                </span>
                <span className="text-foreground">Products</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Discover the latest additions from our sellers
              </p>
            </div>
    <div className="lg:flex">
      {/* Sidebar - Desktop only */}
      <CategorySidebar />
      {/* Main Content - New Products */}
      <NewProductsSection />
      {/* Mobile Category Grid */}
      <CategoryGrid />
    </div>
    </div>
  );
}

export default Category;