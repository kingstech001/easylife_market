"use client";

import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Heart,
  ArrowUp,
  Send,
  MapPin,
  Clock,
  Star,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function ModernFooter() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = () => {
    if (!email) return;
    setIsSubmitting(true);
    // Add newsletter submission logic here
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
    }, 1000);
  };

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: Github,
      href: "#",
      label: "GitHub",
      color: "hover:text-[#333] dark:hover:text-white",
    },
    {
      icon: Twitter,
      href: "#",
      label: "Twitter",
      color: "hover:text-[#1DA1F2]",
    },
    {
      icon: Linkedin,
      href: "#",
      label: "LinkedIn",
      color: "hover:text-[#0A66C2]",
    },
    { icon: Mail, href: "#", label: "Email", color: "hover:text-[#c0a146]" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-background via-muted/10 to-background border-t border-border/50 overflow-hidden">
      {/* Enhanced decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(192,161,70,0.05),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(192,161,70,0.03),transparent_50%)] pointer-events-none" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-48 h-48 sm:w-64 sm:h-64 bg-[#c0a146]/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-[10%] right-[10%] w-56 h-56 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-5 pointer-events-none" />

      {/* Main footer content */}
      <div className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand section - 4 columns on large screens */}
            <div className="lg:col-span-4 space-y-5 sm:space-y-6">
              <div className="space-y-4">
                <Link href="/" className="inline-flex items-center group">
                  <Image alt="" src={"/logo.png"} width={40} height={40} />
                  <div className="">
                    <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-clip-text text-transparent">
                      EasyLife
                    </span>
                  </div>
                </Link>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
                  Building the future of e-commerce with modern technology and
                  exceptional user experience. Join thousands of successful
                  sellers today.
                </p>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"
                      >
                        <Star className="w-3 h-3 fill-[#c0a146] text-[#c0a146]" />
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="w-2.5 h-2.5 fill-[#c0a146] text-[#c0a146]"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      10K+ Happy Users
                    </p>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Follow Us
                </p>
                <div className="flex space-x-2">
                  {socialLinks.map((social) => (
                    <Button
                      key={social.label}
                      variant="outline"
                      size="icon"
                      className={`h-9 w-9 sm:h-10 sm:w-10 border-border/50 hover:border-[#c0a146]/50 transition-all duration-300 hover:scale-110 ${social.color}`}
                      asChild
                    >
                      <Link href={social.href}>
                        <social.icon className="h-4 w-4" />
                        <span className="sr-only">{social.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links - 2 columns */}
            <div className="lg:col-span-2 space-y-5">
              <h3 className="font-bold text-sm sm:text-base uppercase tracking-wider text-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-[#c0a146] to-primary rounded-full" />
                Quick Links
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Home", href: "/" },
                  { name: "Stores", href: "/stores" },
                  { name: "About Us", href: "/about" },
                  { name: "Contact", href: "/contact" },
                  { name: "Blog", href: "/blog" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-[#c0a146] transition-all duration-200"
                    >
                      <span className="w-0 h-px bg-[#c0a146] group-hover:w-4 transition-all duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support - 2 columns */}
            <div className="lg:col-span-2 space-y-5">
              <h3 className="font-bold text-sm sm:text-base uppercase tracking-wider text-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-primary to-[#c0a146] rounded-full" />
                Support
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Help Center", href: "/help" },
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "Cookie Policy", href: "/cookies" },
                  { name: "FAQ", href: "/faq" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm sm:text-base text-muted-foreground hover:text-[#c0a146] transition-all duration-200"
                    >
                      <span className="w-0 h-px bg-[#c0a146] group-hover:w-4 transition-all duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter - 4 columns */}
            <div className="lg:col-span-4 space-y-5">
              <div className="space-y-3">
                <h3 className="font-bold text-sm sm:text-base uppercase tracking-wider text-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-[#c0a146] to-primary rounded-full" />
                  Stay Updated
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Subscribe to our newsletter for exclusive offers, product
                  updates, and industry insights.
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c0a146]/20 focus:border-[#c0a146]/50 transition-all duration-300 group-hover:border-border pr-24"
                  />
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleNewsletterSubmit}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 sm:h-9 px-4 bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline ml-2">Subscribe</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Award className="w-3 h-3 text-[#c0a146] mt-0.5 shrink-0" />
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>

              {/* Contact info */}
              <div className="pt-4 space-y-2.5 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-[#c0a146]" />
                    <span>Enugu, Nigeria</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 text-[#c0a146]" />
                    <span>easylifemarket01@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-[#c0a146]" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="opacity-30" />

        {/* Bottom section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                © {currentYear} EasyLife. All rights reserved.
              </p>
              <div className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full" />
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                Built with{" "}
                <Heart className="h-3 w-3 text-red-500 fill-current animate-pulse" />{" "}
                using{" "}
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-border/50"
                >
                  Next.js
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-border/50"
                >
                  MongoDB
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-border/50"
                >
                  Tailwind
                </Badge>
              </div>
            </div>

            {/* Scroll to top button */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToTop}
                    className="bg-background/80 backdrop-blur-sm border-border/50 hover:border-[#c0a146]/50 hover:bg-background transition-all duration-300 hover:scale-105 group"
                  >
                    <ArrowUp className="h-4 w-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                    Back to top
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Decorative bottom line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#c0a146] to-transparent opacity-50" />
      </div>
    </footer>
  );
}
