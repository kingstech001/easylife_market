import { Store } from "lucide-react"
import { Reveal } from "../Reveal"

export default function FeaturesSection() {
    const features = [
        {
            title: "Easy Store Creation",
            description: "Build your store with our intuitive drag-and-drop interface.",
        },
        {
            title: "Customizable Themes",
            description: "Choose from a variety of themes and customize to match your brand.",
        },
        {
            title: "Secure Payments",
            description: "Accept payments securely with our integrated payment solutions.",
        },
    ]

    return (
        <Reveal  direction="down">
            <section className="w-full py-12 md:py-24 lg:py-32 flex items-center justify-center">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                Everything You Need to Succeed
                            </h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Our platform provides all the tools you need to create, manage, and grow your online business.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-12">
                        {features.map((feature, index) => (
                            <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Store className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-bold">{feature.title}</h3>
                                <p className="text-muted-foreground text-center">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </Reveal>
    )
}
