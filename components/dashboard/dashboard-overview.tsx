"use client";

import { useEffect, useState } from "react";
import {
  Store,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Match the API response type
interface DashboardData {
  totalStores: number;
  totalVisits: number;
  totalSales: number;
  totalRevenue: number;
  storesChange: number;
  visitsChange: number;
  salesChange: number;
  revenueChange: number;
}

interface ChangeIndicatorProps {
  change: number;
  isPercent?: boolean;
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/admin")
      .then((res) => res.json())
      .then((json: DashboardData) => setData(json))
      .catch(console.error);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Stores */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalStores}</div>
          <ChangeIndicator change={data.storesChange} />
        </CardContent>
      </Card>

      {/* Total Visits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.totalVisits.toLocaleString()}
          </div>
          <ChangeIndicator change={data.visitsChange} isPercent />
        </CardContent>
      </Card>

      {/* Total Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalSales}</div>
          <ChangeIndicator change={data.salesChange} isPercent />
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data.totalRevenue.toLocaleString()}
          </div>
          <ChangeIndicator change={data.revenueChange} isPercent />
        </CardContent>
      </Card>
    </div>
  );
}

function ChangeIndicator({ change, isPercent }: ChangeIndicatorProps) {
  const positive = change > 0;
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      {positive ? (
        <>
          <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
          <span className="text-emerald-500">
            +{change}
            {isPercent && "%"}
          </span>
        </>
      ) : (
        <>
          <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
          <span className="text-rose-500">
            -{Math.abs(change)}
            {isPercent && "%"}
          </span>
        </>
      )}
      <span className="ml-1">since last month</span>
    </div>
  );
}
