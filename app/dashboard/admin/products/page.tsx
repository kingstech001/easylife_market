import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/dashboard/data-table"
import { mockProducts } from "@/lib/mock-data"
import { columns } from "@/components/dashboard/products-columns"

export default function ProductsPage() {
  // In a real app, we would fetch this data from the API
  const products = mockProducts

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Button asChild>
          <Link href="/dashboard/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={products} />
    </div>
  )
}
