import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { mockStores } from "@/lib/mock-data"
import { StoreCard } from "@/components/dashboard/store-card"

export default function StoresPage() {
  // In a real app, we would fetch this data from the API
  const stores = mockStores

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Stores</h2>
        <Button asChild>
          <Link href="/dashboard/stores/create">
            <Plus className="mr-2 h-4 w-4" />
            New Store
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}

        {stores.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="mt-4 text-lg font-semibold">No stores yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You haven't created any stores yet. Create your first store to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/stores/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Store
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
