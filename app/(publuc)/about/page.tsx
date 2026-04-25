import {
  Target,
  Eye,
  Heart,
  CheckCircle2,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import AboutHero from "./AboutHero"

const stats = [
  { label: "Active Stores", value: "500+" },
  { label: "Products Listed", value: "10K+" },
  { label: "Happy Customers", value: "5K+" },
  { label: "Daily Transactions", value: "100+" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section - Client Component (has image cycling) */}
      <AboutHero />

      {/* Stats Section - Static, rendered on the server */}
      <section className="py-12 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#e1a200] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Static */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Mission */}
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#e1a200]/10">
                    <Target className="h-6 w-6 text-[#e1a200]" />
                  </div>
                  <h2 className="text-2xl font-bold">Our Mission</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Our mission is to empower local businesses by providing a digital platform
                  where they can grow. We believe everyone deserves access to the tools and
                  technology needed to sell their products, no matter their background or
                  location.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#e1a200]/10">
                    <Eye className="h-6 w-6 text-[#e1a200]" />
                  </div>
                  <h2 className="text-2xl font-bold">Our Vision</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To become the most trusted digital marketplace for communities—helping
                  businesses thrive, helping buyers save time, and making everyday
                  transactions effortless.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Offer */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to succeed in the digital marketplace
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: CheckCircle2, text: "Easy shop creation for sellers" },
                { icon: CheckCircle2, text: "Smooth & intuitive buying experience" },
                { icon: Users, text: "Trusted community marketplace" },
                { icon: TrendingUp, text: "Fast & reliable service delivery" },
              ].map((feature, index) => (
                <Card key={index} className="border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-[#e1a200]/30 h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-3 rounded-xl bg-[#e1a200]/10">
                        <feature.icon className="h-6 w-6 text-[#e1a200]" />
                      </div>
                      <p className="font-medium text-sm leading-relaxed">
                        {feature.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Why We Built This */}
          <div className="mt-16">
            <Card className="border-border/40 bg-gradient-to-br from-card/50 to-muted/30 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#e1a200]/10">
                    <Heart className="h-6 w-6 text-[#e1a200]" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Why We Built This Platform
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  EasyLife Market was created to solve real problems: limited visibility for
                  small businesses, lack of online presence, and difficulty connecting buyers
                  with trustworthy sellers. Our platform gives everyone a digital space to
                  connect, trade, and grow together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#e1a200]/10 via-transparent to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join Our Community?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Whether you're here to shop or sell, EasyLife Market welcomes you. Together,
              we are building a smarter, easier, and more connected experience for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#e1a200] hover:bg-[#e1a200]/90 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/auth/register">
                  Start Selling Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#e1a200]/30 hover:bg-[#e1a200]/10"
              >
                <Link href="/stores">Explore Stores</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
