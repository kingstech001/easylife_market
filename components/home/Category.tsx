// components/Category.tsx

import { CategoryGrid, CategorySidebar } from "../CategoryGrid";
import NewProductsSection from "../NewProductsSection";
// import NewProductsSection from "./NewProductsSection";

function Category() {
  return (
    <div className="lg:flex">
      {/* Sidebar - Desktop only */}
      <CategorySidebar />
      
      
      {/* Main Content - New Products */}
      <NewProductsSection />
      {/* Mobile Category Grid */}
      <CategoryGrid />
    </div>
  );
}

export default Category;