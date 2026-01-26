"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  ShoppingBag,
  Store,
  Package,
  TrendingUp,
  ArrowUpRight,
  Eye,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VisitorsChart } from "@/components/dashboard/visitors-chart";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { LoadingSpinner } from "@/components/ui/loading";

type DashboardStats = {
  totalSales: number;
  ordersCount: number;
  customersCount: number;
  productsCount: number;
};


export default function SellerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [storeName, setStoreName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [subscriptionAlert, setSubscriptionAlert] = useState<{
    show: boolean;
    message: string;
    type: "warning" | "info";
  }>({ show: false, message: "", type: "info" });

  // Check subscription status on mount
  const checkSubscription = useCallback(async (storeId: string) => {
    try {
      console.log("🔍 Checking subscription status...");
      const response = await fetch("/api/stores/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Subscription check complete:", data);

        if (data.wasDowngraded) {
          setSubscriptionAlert({
            show: true,
            message: `Your subscription has expired. You've been downgraded to the free plan. ${
              data.enforcement?.deactivated || 0
            } products have been deactivated.`,
            type: "warning",
          });
          toast.warning("Subscription Expired", {
            description: data.message,
          });
        } else if (data.enforcement?.deactivated > 0) {
          setSubscriptionAlert({
            show: true,
            message: `${data.enforcement.deactivated} products have been deactivated due to your plan limit.`,
            type: "info",
          });
        }
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const response = await fetch("/api/dashboard/seller/stats");
      if (!response.ok) {
        let errorMessage = "Failed to fetch dashboard statistics.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text().catch(() => "");
          if (errorText) {
            errorMessage = `Server error: ${errorText.substring(0, 100)}...`;
          }
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setStats(data.data);
    } catch (err: any) {
      setStatsError(err.message || "An unexpected error occurred.");
      toast.error("Failed to load dashboard stats", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch store name
  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/seller/store");
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to fetch store");
      }
      const data = await res.json();
      setStoreName(data.store.name);
      setStoreId(data.store._id);

      // Check subscription after getting store ID
      if (data.store._id) {
        await checkSubscription(data.store._id);
      }
    } catch (error: any) {
      console.error("Error fetching store:", error);
      setStoreError(error.message || "Unable to fetch store");
    }
  }, [checkSubscription]);

  useEffect(() => {
    fetchDashboardStats();
    fetchStore();
  }, [fetchDashboardStats, fetchStore]);

  const dashboardItems = [
    {
      title: "Customers",
      description: "View and manage your customer base",
      icon: Users,
      href: "/dashboard/seller/customers",
      buttonText: "View Customers",
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50 dark:bg-violet-950/50",
      borderColor: "border-violet-200 dark:border-violet-800",
    },
    {
      title: "Products",
      description: "Manage and add products to your store",
      icon: ShoppingBag,
      href: "/dashboard/seller/products",
      buttonText: "Manage Products",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "Orders",
      description: "Track and manage customer orders",
      icon: Package,
      href: "/dashboard/seller/orders",
      buttonText: "View Orders",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
  ];

  if (isLoadingStats && !stats) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <LoadingSpinner text="Loading your dashboard…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container max-w-7xl mx-auto space-y-8">
        {/* Subscription Alert - FIXED */}
        {subscriptionAlert.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Alert
              variant={subscriptionAlert.type === "warning" ? "destructive" : "default"}
              className={
                subscriptionAlert.type === "warning"
                  ? "border-red-500 bg-red-50 dark:bg-red-950/50"
                  : "border-orange-500 bg-orange-50 dark:bg-orange-950/50"
              }
            >
              <AlertCircle 
                className={
                  subscriptionAlert.type === "warning"
                    ? "h-4 w-4 text-red-600 dark:text-red-400"
                    : "h-4 w-4 text-orange-600 dark:text-orange-400"
                }
              />
              <AlertTitle
                className={
                  subscriptionAlert.type === "warning"
                    ? "text-red-900 dark:text-red-100 font-semibold"
                    : "text-orange-900 dark:text-orange-100 font-semibold"
                }
              >
                {subscriptionAlert.type === "warning"
                  ? "⚠️ Subscription Expired"
                  : "Notice"}
              </AlertTitle>
              <AlertDescription
                className={
                  subscriptionAlert.type === "warning"
                    ? "text-red-800 dark:text-red-200"
                    : "text-orange-800 dark:text-orange-200"
                }
              >
                {subscriptionAlert.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className=" items-start gap-4">
              <div className="flex gap-2 items-center">
                <div className="h-16 w-16 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Store className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Welcome back,{" "}
                  <span className="block sm:inline bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {storeName || "Your Store"}
                  </span>
                </h1>
                {storeError && (
                  <p className="text-red-500 text-sm">{storeError}</p>
                )}
              </div>
              </div>
                <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 mt-2">
                  Manage your store and track your success
                </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Eye className="h-3 w-3 mr-1" />
                Live Store
              </Badge>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Overview
            </h2>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Last 30 days
            </Badge>
          </div>

          {statsError ? (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
              <CardContent className="flex items-center justify-center h-32 text-red-600 dark:text-red-400">
                <p>Error loading stats: {statsError}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="border-1 border transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total Sales
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            ₦{stats?.totalSales.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <BarChart3 className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +12.5% from last month
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="border-1 border transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Orders
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {stats?.ordersCount.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +8.2% from last month
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="border-1 border transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Customers
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {stats?.customersCount.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-6 w-6 text-violet-600" />
                        </div>
                      </div>
                      <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +15.3% from last month
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card className="border-1 border transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Products
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {stats?.productsCount.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Package className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +5.7% from last month
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <Card className="border-1 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Visitors
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Total visitors over time
                  </CardDescription>
                </div>
                <Badge variant="secondary">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <VisitorsChart />
            </CardContent>
          </Card>

          <Card className="border-1 border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Sales
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Revenue trends and performance
                  </CardDescription>
                </div>
                <Badge variant="secondary">₦</Badge>
              </div>
            </CardHeader>
            <CardContent >
              <SalesChart />
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="lg:col-span-2"
          >
            <Card className="border-1 border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Manage your store efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {dashboardItems.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <Link href={item.href}>
                        <Card
                          className={`border ${item.borderColor} hover:shadow-md transition-all duration-300 group cursor-pointer`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 ${item.iconBg} rounded-lg group-hover:scale-110 transition-transform duration-300`}
                              >
                                <item.icon
                                  className={`h-5 w-5 ${item.iconColor}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  {item.description}
                                </p>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <Card className="border-1 border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Top Products
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Your best-selling items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopProducts />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}