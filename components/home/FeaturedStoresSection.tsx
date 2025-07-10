import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StoreCard } from "@/components/store-card"
import { mockStores } from "@/lib/mock-data"
import { Reveal } from "../Reveal"

export default function FeaturedStoresSection() {
    const featuredStores = mockStores.slice(0, 3)

    return (
        <Reveal direction="down" >
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted flex items-center justify-center">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Featured Stores</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Discover some of the amazing stores created with our platform.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-12">
                        {featuredStores.map((store) => (
                            <StoreCard key={store.id} store={store} />
                        ))}
                    </div>
                    <div className="flex justify-center mt-12">
                        <Link href="/stores">
                            <Button variant="outline" className="gap-1">
                                View All Stores <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Reveal>
    )
}
