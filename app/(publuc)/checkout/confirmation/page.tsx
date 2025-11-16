"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

// Force dynamic rendering
export const dynamic = "force-dynamic";

function PaymentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2">
        <CardHeader className="text-center bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-b-2">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-900 dark:text-green-100">
            Order Confirmed!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your payment was successful and your order has been placed
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Order Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Order Reference
                </p>
                <p className="font-mono font-semibold">{reference || "N/A"}</p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                Paid
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    What happens next?
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                    <li>You'll receive an email confirmation shortly</li>
                    <li>The seller will process your order</li>
                    <li>You'll be notified when your order ships</li>
                    <li>Track your order status in your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="h-12 rounded-xl border-2"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <Button
              onClick={() => router.push("/dashboard/buyer/orders")}
              className="h-12 rounded-xl shadow-lg"
              size="lg"
            >
              <Package className="mr-2 h-4 w-4" />
              View My Orders
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link
                href="https://wa.me/2348071427831"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-white hover:text-green-600 transition-colors duration-200"
              >
                Contact our support team
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading fallback
function PaymentConfirmationLoading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
    </div>
  );
}

// Main component with Suspense
export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<PaymentConfirmationLoading />}>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
