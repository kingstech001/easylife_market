"use client"

import Link from "next/link"
import { Github, Twitter, Linkedin, Mail, Heart, ArrowUp, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"

export function ModernFooter() {
    const [showScrollTop, setShowScrollTop] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const currentYear = new Date().getFullYear()

    return (
        <footer className="relative bg-gradient-to-t from-background via-background to-background/50 border-t border-border/50">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            {/* Main footer content */}
            <div className="relative">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="flex justify-between flex-wrap gap-8 lg:gap-12">
                        {/* Brand section */}
                        <div className="space-y-4">
                            <Link href="/" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-primary-foreground font-bold text-sm" />
                                </div>
                                <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">EasyLife</span>
                            </Link>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                                Building the future of e-commerce with modern technology and exceptional user experience.
                            </p>
                            <div className="flex space-x-3">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                    <Github className="h-4 w-4" />
                                    <span className="sr-only">GitHub</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                    <Twitter className="h-4 w-4" />
                                    <span className="sr-only">Twitter</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                    <Linkedin className="h-4 w-4" />
                                    <span className="sr-only">LinkedIn</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                    <Mail className="h-4 w-4" />
                                    <span className="sr-only">Email</span>
                                </Button>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Quick Links</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Home", href: "/" },
                                    { name: "Stores", href: "/stores" },
                                    { name: "About", href: "/about" },
                                    { name: "Contact", href: "/contact" },
                                ].map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-block"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Support</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: "Help Center", href: "/help" },
                                    { name: "Privacy Policy", href: "/privacy" },
                                    { name: "Terms of Service", href: "/terms" },
                                    { name: "Cookie Policy", href: "/cookies" },
                                ].map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-block"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">Stay Updated</h3>
                            <p className="text-sm text-muted-foreground">
                                Subscribe to our newsletter for the latest updates and features.
                            </p>
                            <div className="space-y-3">
                                <div className="flex space-x-2">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
                                    />
                                    <Button size="sm" className="px-4">
                                        Subscribe
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">We respect your privacy. Unsubscribe at any time.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="opacity-50" />

                {/* Bottom section */}
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">© {currentYear} Store. All rights reserved.</p>
                            <div className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full" />
                            <p className="flex flex-wrap items-center gap-2">
                                Built with <Heart className="h-3 w-3 text-red-500 fill-current animate-pulse" /> using{" "}
                                <span className="font-medium text-foreground">Next.js</span>,{" "}
                                <span className="font-medium text-foreground">MongoDB</span>,{" "}
                                <span className="font-medium text-foreground">shadcn/ui</span>,{" "}
                                <span className="font-medium text-foreground">Tailwind CSS</span>
                            </p>
                        </div>

                        {/* Scroll to top button */}
                        {showScrollTop && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={scrollToTop}
                                className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background hover:border-border transition-all duration-200"
                            >
                                <ArrowUp className="h-4 w-4 mr-2" />
                                Back to top
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating decorative elements */}
            <div className="absolute top-0 left-1/4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        </footer>
    )
}
