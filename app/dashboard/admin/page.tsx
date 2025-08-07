import type { Metadata } from "next"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { StoresList } from "@/components/dashboard/stores-list"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"

export const metadata: Metadata = {
  title: "Dashboard | ShopBuilder",
  description: "Manage your e-commerce stores and products",
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <DashboardOverview />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 md:col-span-1 lg:col-span-4">
          <StoresList />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-3">
          <div className="flex flex-col gap-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  )
}
