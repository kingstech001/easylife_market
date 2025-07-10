import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "../Reveal"

export default function CallToActionSection() {
    return (
        <Reveal direction="down">
            <section className="w-full py-12 md:py-24 lg:py-32 flex items-center justify-center">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                Ready to Start Selling Online?
                            </h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Join thousands of entrepreneurs who have launched their online business with EasyLife.
                            </p>
                        </div>
                        <Link href="/create-store">
                            <Button size="lg" className="gap-1">
                                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Reveal>
    )
}
