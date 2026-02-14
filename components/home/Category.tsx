import { CategoryGrid, CategorySidebar } from "../CategoryGrid";

function Category() {
  return (
    <div className="lg:flex p-2">
      <CategorySidebar />
      <CategoryGrid/>
      <div className="flex-1 flex items-center flex-col">
        <h1>New Products</h1>
      </div>
    </div>
  );
}

export default Category;
