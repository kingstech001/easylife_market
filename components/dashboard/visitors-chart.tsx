"use client";

import { useState, useEffect } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface VisitorData {
  date: string;
  visitors: number;
}

export function VisitorsChart() {
  const [data, setData] = useState<VisitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/seller/analytics/visitors", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to fetch visitors data");
        }

        setData(Array.isArray(json.data) ? json.data : []);
      } catch (err: any) {
        console.error("Error fetching visitors data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitors();
  }, []);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading visitors data...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error}</p>;
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground">No visitors data available yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="visitors"
          stroke="#8884d8"
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
