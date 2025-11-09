"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Edit,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormatAmount } from "@/hooks/useFormatAmount";

// Define a type for your product data based on the backend response
type Product = {
  _id: string // MongoDB's default ID field
  id: string
  name: string
  category?: string // Optional as per backend schema
  price: number
  inventoryQuantity: number
  images?: { url: string; altText?: string }[] // Optional as per backend schema
  createdAt: string // For sorting by creation date
}

export default function ProductListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof Product>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(
    null
  );
  const { formatAmount } = useFormatAmount();
  const PRODUCT_LIMITS: Record<string, number | null> = {
    free: 10,
    basic: 50,
    standard: null,
    premium: null,
  };
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/seller/products");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch products");
      }
      const data = await response.json()
      const validatedProducts = data.products.map((product: Product, index: number) => ({
        ...product,
        _id: product._id || product.id,
      }))
      setProducts(validatedProducts)
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error("Failed to load products", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(
          "/api/dashboard/seller/subscription/current?storeId=current"
        );
        if (res.ok) {
          const data = await res.json();
          setSubscriptionPlan(data.plan);
        }
      } catch (error) {
        console.error("Failed to fetch subscription plan:", error);
      }
    };

    fetchPlan();
  }, []);

  const filteredAndSortedProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category &&
          product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const handleSort = (column: keyof Product) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleEditProduct = (id: string) => {
    const product = products.find((p) => p._id === id);
    if (product) {
      toast.info(`Editing ${product.name}`);
    }
    router.push(`/dashboard/seller/products/${id}/edit`);
  };

  const confirmDelete = async () => {
    if (!productToDeleteId) return;

    try {
      const response = await fetch(
        `/api/dashboard/seller/products/${productToDeleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product");
      }

      setProducts(
        products.filter((product) => product._id !== productToDeleteId)
      );
      toast.success("Product deleted successfully!", {
        description: `Product ${productToDeleteId} has been removed.`,
      });
    } catch (err: any) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setProductToDeleteId(null);
      setShowDeleteConfirm(false);
    }
  };
  const currentLimit = subscriptionPlan
    ? PRODUCT_LIMITS[subscriptionPlan]
    : null;

  const isLimitReached =
    currentLimit !== null && products.length >= currentLimit;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 sm:px-6">
        {/* Header */}
        {isLimitReached && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-yellow-800 dark:text-yellow-300">
                  Product Limit Reached
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Your{" "}
                  <span className="font-medium capitalize">
                    {subscriptionPlan}
                  </span>{" "}
                  plan allows <span className="font-bold">{currentLimit}</span>{" "}
                  products. Upgrade your subscription to add more.
                </p>
              </div>

              <Button
                className="bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-700 dark:hover:bg-yellow-600"
                onClick={() => router.push("/dashboard/seller/subscriptions")}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col md:flex-row sm:items-center gap-3 sm:gap-4 md:justify-between">
            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-5xl font-bold tracking-tight">
                  Products
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage your store's product inventory
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dashboard/seller/products/create")}
              className="w-full md:w-auto"
              disabled={isLimitReached}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {isLimitReached
                ? `Limit Reached (${currentLimit} products)`
                : "Add New Product"}
            </Button>
          </div>
        </motion.div>

        {/* Product List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20 block m-auto">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                All Products
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:max-w-xs"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="sm:ml-auto bg-transparent"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSort("name")}>
                      Name{" "}
                      {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("category")}>
                      Category{" "}
                      {sortBy === "category" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("price")}>
                      Price{" "}
                      {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSort("inventoryQuantity")}
                    >
                      Stock{" "}
                      {sortBy === "inventoryQuantity" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("createdAt")}>
                      Date Created{" "}
                      {sortBy === "createdAt" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">
                    Loading products...
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-48 text-destructive">
                  <p>Error: {error}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] sm:w-[100px]">
                          Image
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("name")}
                            className="px-0 h-auto"
                          >
                            Product Name
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("category")}
                            className="px-0 h-auto"
                          >
                            Category
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("price")}
                            className="px-0 h-auto"
                          >
                            Price
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("inventoryQuantity")}
                            className="px-0 h-auto"
                          >
                            Stock
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No products found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedProducts.map((product) => (
                          <TableRow key={product._id}>
                            <TableCell>
                              <img
                                src={
                                  product.images?.[0]?.url ||
                                  "/placeholder.svg?height=60&width=60&query=product"
                                }
                                alt={product.name}
                                className="w-12 h-12 rounded-md object-cover"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-[12px]">
                              {product.name}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {product.category || "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatAmount(product.price)}
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              {product.inventoryQuantity}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <span className="sr-only">Open menu</span>
                                    <ArrowUpDown className="h-4 w-4 rotate-90" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditProduct(product._id)
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteProduct(product._id)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                product and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDeleteId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
