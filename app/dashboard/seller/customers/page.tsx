import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/dashboard/data-table"
import { columns, Customer } from "@/components/dashboard/customers-columns"

export default function CustomersPage() {
  const customers: Customer[] = [
    {
      id: "cust-1",
      name: "John Doe",
      email: "john.doe@example.com",
      orders: 5,
      totalSpent: 249.95,
      lastOrder: "2023-04-15",
      status: "active",
    },
    {
      id: "cust-2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      orders: 3,
      totalSpent: 129.85,
      lastOrder: "2023-04-10",
      status: "active",
    },
    {
      id: "cust-3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      orders: 1,
      totalSpent: 49.99,
      lastOrder: "2023-03-25",
      status: "inactive",
    },
    {
      id: "cust-4",
      name: "Alice Williams",
      email: "alice.williams@example.com",
      orders: 8,
      totalSpent: 399.92,
      lastOrder: "2023-04-18",
      status: "active",
    },
    {
      id: "cust-5",
      name: "Charlie Brown",
      email: "charlie.brown@example.com",
      orders: 2,
      totalSpent: 89.98,
      lastOrder: "2023-04-05",
      status: "active",
    },
  ]

  return (
    <div className="space-y-8 md:relative left-52 md:w-[calc(100vw-20rem)]">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>View and manage your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={customers} />
        </CardContent>
      </Card>
    </div>
  )
}
