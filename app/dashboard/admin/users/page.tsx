"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/dashboard/data-table"
import { columns, Customer } from "@/components/dashboard/customers-columns"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customers")
        const data = await res.json()
        if (data.success) {
          setCustomers(
            data.customers.map((c: any) => ({
              id: c._id,
              name: c.name,
              email: c.email,
              orders: c.ordersCount || 0,
              totalSpent: c.totalSpent || 0,
              lastOrder: c.lastOrder ? new Date(c.lastOrder).toISOString().split("T")[0] : "N/A",
              status: c.status || "active",
            }))
          )
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>View and manage your customers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : <DataTable columns={columns} data={customers} />}
        </CardContent>
      </Card>
    </div>
  )
}
