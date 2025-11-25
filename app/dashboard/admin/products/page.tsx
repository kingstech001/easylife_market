import Link from "next/link"
import { Plus } from "lucide-react"
import { headers, cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/dashboard/data-table"
import { columns } from "@/components/dashboard/products-columns"

export default async function ProductsPage() {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"

  let products: any[] = []

  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ")

    const res = await fetch(`${protocol}://${host}/api/products?limit=200`, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to fetch products")

    const data = await res.json()
    products = data.products || []
  } catch (error) {
    console.error("Error fetching products:", error)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Button asChild>
          <Link href="/dashboard/admin/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={products} />
    </div>
  )
}
