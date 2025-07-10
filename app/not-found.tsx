"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Home, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedContainer } from "@/components/ui/animated-container"

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <AnimatedContainer animation="scale" className="text-center mb-8 max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center mb-6"
        >
          <div className="text-9xl font-bold text-primary">404</div>
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">The page you are looking for doesn't exist or has been moved.</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </AnimatedContainer>

      <AnimatedContainer animation="fadeIn" delay={0.2} className="w-full max-w-md mt-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for products..."
            className="pl-10 pr-4"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value
                if (value) {
                  router.push(`/search?q=${encodeURIComponent(value)}`)
                }
              }
            }}
          />
        </div>
      </AnimatedContainer>
    </div>
  )
}
