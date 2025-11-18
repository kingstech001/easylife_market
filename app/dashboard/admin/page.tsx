"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ShoppingBag,
  Users,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisitorsChart } from "@/components/dashboard/visitors-chart";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { TopStores } from "@/components/dashboard/top-stores";
import { useAuth } from "@/context/AuthContext";

interface DashboardData {
  totalStores?: number;
  totalVisits?: number;
  totalSales?: number;
  totalRevenue?: number;
  visitsChange?: number;
  salesChange?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AnalyticsOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // ✅ Only wait for auth to finish loading
    if (authLoading) return;

    // ✅ Fetch data - let the API handle auth
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/dashboard/admin", {
          credentials: "include",
        });
        
        // ✅ If unauthorized, API will handle redirect via middleware
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authLoading]);

  const metrics = [
    {
      title: "Total Visitors",
      value: data?.totalVisits?.toLocaleString() || "0",
      change: `${data?.visitsChange && data.visitsChange > 0 ? "+" : ""}${
        data?.visitsChange ?? 0
      }%`,
      icon: Eye,
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Sales",
      value: data?.totalSales?.toLocaleString() || "0",
      change: `${data?.salesChange && data.salesChange > 0 ? "+" : ""}${
        data?.salesChange ?? 0
      }%`,
      icon: ShoppingBag,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconColor: "text-emerald-600",
    },
    {
      title: "Active Stores",
      value: data?.totalStores?.toLocaleString() || "0",
      change: "+0%",
      icon: Users,
      iconBg: "bg-violet-50 dark:bg-violet-950/30",
      iconColor: "text-violet-600",
    },
    {
      title: "Total Revenue",
      value: `₦${data?.totalRevenue?.toLocaleString() || "0"}`,
      change: "+0%",
      icon: BarChart3,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      iconColor: "text-amber-600",
    },
  ];

  // ✅ Show loading while auth or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-start justify-between"
          >
            <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-foreground">
              Analytics Overview
            </h1>
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="h-3 w-3 m-auto" />
              Last 30 days
            </Badge>
          </motion.div>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
            Monitor your platform performance and key metrics
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.div key={metric.title} variants={itemVariants}>
                <Card className="relative overflow-hidden border-border hover:border-foreground/20 transition-all duration-300 group">
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {metric.value}
                        </p>
                      </div>
                      <div
                        className={`p-3 ${metric.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {metric.change}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        from last month
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Visitors Chart */}
          <motion.div variants={itemVariants}>
            <Card className="border-border hover:border-foreground/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Visitors Over Time</CardTitle>
                <CardDescription>
                  Daily visitor trends for the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VisitorsChart />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales Chart */}
          <motion.div variants={itemVariants}>
            <Card className="border-border hover:border-foreground/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Sales Performance</CardTitle>
                <CardDescription>
                  Daily sales trends for the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Bottom Section - Top Products and Stores */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Top Products */}
          <motion.div variants={itemVariants}>
            <Card className="border-border hover:border-foreground/20 transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Top Products</CardTitle>
                <CardDescription>
                  Best-selling products across all stores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopProducts />
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Stores */}
          <motion.div variants={itemVariants}>
            <Card className="border-border hover:border-foreground/20 transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Top Stores</CardTitle>
                <CardDescription>Your best-performing stores</CardDescription>
              </CardHeader>
              <CardContent>
                <TopStores />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}