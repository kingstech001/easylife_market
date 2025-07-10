import type { Metadata } from "next"

import { mockStores } from "@/lib/mock-data"
import { StoreCard } from "@/components/store-card"

export const metadata: Metadata = {
  title: "Browse Stores | ShopBuilder",
  description: "Discover and shop from a variety of online stores created with ShopBuilder",
}

export default function StoresPage() {
  return (
    <div className="py-10 flex-1">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Browse Stores</h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Discover unique products from our community of online stores.
        </p>
      </div>
      <div className="flex-1 flex justify-center items-center px-4 sm:px-8">

        <div className="grid grid-cols-auto-fill min-w-[200px] max-w-[1146px] m-auto gap-[30px]">
          {mockStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </div>
    </div>
  )
}
