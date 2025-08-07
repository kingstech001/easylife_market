"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SalesData {
  date: string;
  sales: number;
}

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/seller/analytics/sales", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to fetch sales data");
        }

        setData(Array.isArray(json.data) ? json.data : []);
      } catch (err: any) {
        console.error("Error fetching sales data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, []);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading sales data...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error}</p>;
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground">No sales data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
