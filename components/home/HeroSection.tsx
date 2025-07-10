"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Store } from "lucide-react"
import { Reveal } from "../Reveal"

export default function HeroSection() {
    return (
        <Reveal>
            {/* Hero Section */}
            <section
                className="w-full py-12 md:py-24 lg:py-32 bg-cover bg-center bg-no-repeat relative bg-fixed"
                style={{ backgroundImage: "url('/ecommerce-bg.jpg')" }}
            >
                <div className="absolute inset-0 bg-muted/80" />
                <div className="container relative z-10 px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center max-w-[1024px] mx-auto">
                        <div className="flex flex-col justify-center space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-center sm:text-left text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                    Create Your Own E-commerce Store
                                </h1>
                                <p className="text-center sm:text-left max-w-[600px] text-muted-foreground md:text-xl">
                                    Build, customize, and launch your online store in minutes. No coding required.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center sm:justify-start items-center">
                                <Link href="/auth/login">
                                    <Button size="lg" className="gap-1 px-4 py-2 text-sm min-[400px]:text-base min-[400px]:px-6 min-[400px]:py-3">
                                        Create a Store <Store className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/stores">
                                    <Button variant="outline" size="lg" className="gap-1 px-4 py-2 text-sm min-[400px]:text-base min-[400px]:px-6 min-[400px]:py-3">
                                        Browse Stores <ShoppingBag className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="mx-auto lg:ml-auto flex justify-center">
                            <div className="relative w-full max-w-[500px] aspect-square">
                                <Image
                                    src="/placeholder.svg?height=500&width=500"
                                    alt="Hero Image"
                                    fill
                                    className="object-cover rounded-lg"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Reveal>
    )
}
