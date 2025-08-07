'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PackageSearch,
  PackageCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Order {
  _id: string;
  product: string;
  status: string;
  date: string;
  amount: string;
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          credentials: 'include', // send cookie token
        });
        const data = await res.json();
        setOrders(data.orders);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Badge variant="success">Delivered</Badge>;
      case "Pending":
        return <Badge variant="outline">Pending</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 py-10">

      <div className="flex items-center gap-3">
        <PackageSearch className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">My Orders</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <>
              <div className="text-center text-sm text-muted-foreground mt-6">
                <PackageCheck className="mx-auto mb-2 h-6 w-6" />
                No orders placed yet.
              </div>
              <div className="text-center mt-6">
                <Link href="/stores">
                  <Button variant="default" size="sm">
                    Place order now
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>{order._id}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="text-right">{order.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
