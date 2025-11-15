"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles, Banknote } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";

type SubscriptionPlan = "free" | "basic" | "standard" | "premium";

interface Plan {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  features: string[];
  color: {
    bg: string;
    bgDark: string;
    text: string;
    border: string;
    borderDark: string;
  };
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free Plan",
    description: "Perfect for getting started",
    price: 0,
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      "Up to 10 products",
      "Basic analytics",
      "Email support",
      "Standard commission rate",
    ],
    color: {
      bg: "bg-slate-50",
      bgDark: "dark:bg-slate-900/50",
      text: "text-slate-600",
      border: "border-slate-200",
      borderDark: "dark:border-slate-800",
    },
  },
  {
    id: "basic",
    name: "Basic Plan",
    description: "For growing sellers",
    price: 2000,
    icon: <Zap className="h-6 w-6 text-blue-600" />,
    features: [
      "Up to 20 products",
      "Advanced analytics",
      "Priority email support",
      "Reduced commission rate",
      "Custom store branding",
    ],
    color: {
      bg: "bg-blue-50",
      bgDark: "dark:bg-blue-950/50",
      text: "text-blue-600",
      border: "border-blue-200",
      borderDark: "dark:border-blue-800",
    },
  },
  {
    id: "standard",
    name: "Standard Plan",
    description: "For established stores",
    price: 4000,
    icon: <Crown className="h-6 w-6 text-emerald-600" />,
    features: [
      "Up to 50 products",
      "Real-time analytics",
      "24/7 phone support",
      "Lowest commission rate",
      "Advanced marketing tools",
      "API access",
    ],
    color: {
      bg: "bg-emerald-50",
      bgDark: "dark:bg-emerald-950/50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      borderDark: "dark:border-emerald-800",
    },
  },
  {
    id: "premium",
    name: "Premium Plan",
    description: "For enterprise sellers",
    price: 6000,
    icon: <Crown className="h-6 w-6 text-violet-600" />,
    features: [
      "Everything in Standard",
      "Unlimited products",
      "Dedicated support team",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "Priority feature requests",
      "Custom analytics dashboard",
    ],
    color: {
      bg: "bg-violet-50",
      bgDark: "dark:bg-violet-950/50",
      text: "text-violet-600",
      border: "border-violet-200",
      borderDark: "dark:border-violet-800",
    },
  },
];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>("free");
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [sellerEmail, setSellerEmail] = useState<string>("");

  useEffect(() => {
    const fetchStoreAndPlan = async () => {
      try {
        const response = await fetch(
          "/api/dashboard/seller/subscription/current?storeId=current"
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.plan || "free");
          setStoreId(data.storeId);
          setSellerEmail(data.email || "");
        }
      } catch (error) {
        console.error("Error fetching current plan:", error);
        toast.error("Failed to load subscription information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreAndPlan();
  }, []);

  const handleSubscribe = useCallback(
    async (plan: Plan) => {
      if (plan.id === currentPlan) {
        toast.info("You are already on this plan");
        return;
      }

      if (!storeId) {
        toast.error("Store information not found");
        return;
      }

      if (!sellerEmail) {
        toast.error("Seller email not found");
        return;
      }

      // 🆓 Handle Free Plan instantly
      if (plan.price === 0) {
        try {
          setLoadingPlan(plan.id);
          const response = await fetch("/api/dashboard/seller/subscription", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId,
              plan: plan.id,
              amount: 0,
              reference: "free-plan",
            }),
          });

          if (response.ok) {
            setCurrentPlan(plan.id);
            toast.success("Successfully switched to Free Plan");
          } else {
            toast.error("Failed to update subscription");
          }
        } catch (error) {
          toast.error("An error occurred");
          console.error(error);
        } finally {
          setLoadingPlan(null);
        }
        return;
      }

      // 💳 Handle Paid Plans via Paystack
      try {
        setLoadingPlan(plan.id);

        const res = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            email: sellerEmail,
            amount: plan.price, // amount in naira
            plan: plan.id,
            storeId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to initialize payment");
          setLoadingPlan(null);
          return;
        }

        if (data.authorization_url) {
          // Redirect seller to Paystack hosted page
          window.location.href = data.authorization_url;
        } else {
          toast.error("Payment initialization failed");
        }
      } catch (error) {
        toast.error("Failed to initialize payment");
        console.error(error);
      } finally {
        setLoadingPlan(null);
      }
    },
    [currentPlan, storeId, sellerEmail]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Please wait..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="flex space-x-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Banknote />
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Choose Your Subscription Plan
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 ">
            Upgrade your plan to unlock more features for your store and grow
            your business
          </p>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="grid grid-cols-auto-fill min-w-[200px]  m-auto gap-[30px]"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card
                className={`relative border-2 transition-all duration-300 group h-full flex flex-col ${
                  currentPlan === plan.id
                    ? `${plan.color.border} ${plan.color.borderDark} shadow-lg`
                    : `border-slate-200 dark:border-slate-800 hover:shadow-md`
                }`}
              >
                {/* Current Plan Badge */}
                {currentPlan === plan.id && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-xl ${plan.color.bg} ${plan.color.bgDark} group-hover:scale-110 transition-transform duration-300`}
                    >
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-6">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        ₦{plan.price.toLocaleString()}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          /month
                        </span>
                      )}
                    </div>
                    {plan.price === 0 && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Forever free
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.color.text}`}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={currentPlan === plan.id || loadingPlan !== null}
                    className={`w-full transition-all duration-300 ${
                      currentPlan === plan.id
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                        : plan.id === "premium"
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : plan.id === "standard"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : plan.id === "basic"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white"
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <LoadingSpinner />
                        Processing...
                      </>
                    ) : currentPlan === plan.id ? (
                      "Current Plan"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="grid gap-6 md:grid-cols-3"
        >
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Flexible Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Upgrade or downgrade your plan anytime. Changes take effect
                immediately.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Secure Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All payments are processed securely through Paystack with
                encryption.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                24/7 Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Our support team is here to help you succeed with your store.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
