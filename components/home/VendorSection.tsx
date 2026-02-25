    // components/home/VendorSection.tsx
    "use client";

    import Link from "next/link";
    import Image from "next/image";
    import { useState, useEffect } from "react";
    import { Button } from "@/components/ui/button";
    import { Badge } from "@/components/ui/badge";
    import {
    Store,
    TrendingUp,
    BarChart3,
    Users,
    CheckCircle,
    ArrowRight,
    Rocket,
    } from "lucide-react";

    interface StorePreview {
    _id: string;
    businessName?: string;
    name?: string;
    logo?: string;
    logo_url?: string;
    slug?: string;
    }

    export function VendorSection() {
    const [storePreviews, setStorePreviews] = useState<StorePreview[]>([]);

    useEffect(() => {
        async function fetchStores() {
        try {
            const res = await fetch("/api/stores?limit=5", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            // Handle both { stores: [] } and direct array responses
            const stores: StorePreview[] = Array.isArray(data)
            ? data
            : data.stores || data.data || [];
            setStorePreviews(stores.slice(0, 5));
        } catch (err) {
            console.error("Failed to fetch store previews:", err);
        }
        }
        fetchStores();
    }, []);

    const benefits = [
        {
        icon: Store,
        title: "Launch in Minutes",
        description: "Create your branded online store with zero technical skills required",
        },
        {
        icon: BarChart3,
        title: "Manage Everything",
        description: "Simple dashboard to add products, track orders, and manage inventory",
        },
        {
        icon: Users,
        title: "Reach More Customers",
        description: "Get discovered by thousands of active shoppers on our platform",
        },
        {
        icon: TrendingUp,
        title: "Grow Your Business",
        description: "Access powerful tools and insights to scale your sales quickly",
        },
    ];

    return (
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
            <div
            className="absolute inset-0"
            style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.05) 1px, transparent 0)`,
                backgroundSize: "40px 40px",
            }}
            />
        </div>

        {/* Minimal Accent */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#e1a200]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4b55e]/5 rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-12 md:mb-16">
            {/* Badge */}
            <div className="flex justify-center mb-6">
                <Badge className="bg-gradient-to-r from-[#e1a200] to-[#d4b55e] text-white border-0 px-4 py-2 text-sm font-semibold shadow-sm">
                <Rocket className="w-4 h-4 mr-2" />
                For Vendors
                </Badge>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="block text-foreground">Turn your passion into</span>
                <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent">
                profit today
                </span>
            </h2>

            {/* Supporting Paragraph */}
            <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Launch your online store in minutes—no technical skills needed. Add products, manage orders,
                and reach thousands of customers, all from one simple dashboard. Start selling and growing your
                business on EasyLife today.
            </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => (
                <div
                key={index}
                className="group relative bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#e1a200]/30 transition-all duration-300 hover:-translate-y-1"
                >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-to-br from-[#e1a200] to-[#d4b55e] text-white shadow-sm">
                    <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
            ))}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm text-muted-foreground">
            {[
                "Free to Start",
                "No Setup Fees",
                "Easy Dashboard",
                "Instant Payouts",
            ].map((label, i, arr) => (
                <div key={label} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-medium">{label}</span>
                {i < arr.length - 1 && <div className="w-px h-4 bg-border ml-6" />}
                </div>
            ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] hover:from-[#d4b55e] hover:via-[#e1a200] hover:to-[#d4b55e] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full group"
                >
                Create Your Store
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>

            <Link href="/stores" className="w-full sm:w-auto">
                <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2 hover:border-[#e1a200] hover:bg-[#e1a200]/5 rounded-full transition-all duration-300"
                >
                See Success Stories
                </Button>
            </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">
                Join thousands of successful sellers
            </p>
            <div className="flex items-center justify-center gap-2">
                {/* Store logo avatars */}
                <div className="flex -space-x-3">
                {storePreviews.length > 0
                    ? storePreviews.map((store, i) => {
                        const logoUrl = store.logo || store.logo_url;
                        const displayName = store.businessName || store.name || "S";
                        const initial = displayName.charAt(0).toUpperCase();

                        return (
                        <div
                            key={store._id}
                            className="w-10 h-10 rounded-full border-2 border-background shadow-sm overflow-hidden bg-gradient-to-br from-[#e1a200] to-[#d4b55e] flex items-center justify-center"
                            title={displayName}
                            style={{ zIndex: storePreviews.length - i }}
                        >
                            {logoUrl ? (
                            <Image
                                src={logoUrl}
                                alt={displayName}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                            ) : (
                            <span className="text-white font-bold text-sm">
                                {initial}
                            </span>
                            )}
                        </div>
                        );
                    })
                    : // Fallback placeholders while loading
                    Array.from({ length: 5 }).map((_, i) => (
                        <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-background shadow-sm bg-gradient-to-br from-[#e1a200]/40 to-[#d4b55e]/40 animate-pulse"
                        style={{ zIndex: 5 - i }}
                        />
                    ))}
                </div>
                <span className="text-sm font-medium text-foreground ml-1">
                +5,000 active sellers
                </span>
            </div>
            </div>
        </div>
        </section>
    );
    }