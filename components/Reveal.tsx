// components/Reveal.tsx
"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useEffect, useState } from "react"

interface RevealProps {
  children: React.ReactNode
  delay?: number
  direction?: "left" | "right" | "up" | "down"
}

export const Reveal = ({
  children,
  delay = 0.2,
  direction = "up",
}: RevealProps) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (inView) setHasAnimated(true)
  }, [inView])

  const getOffset = () => {
    switch (direction) {
      case "left":
        return { x: -50, y: 0 }
      case "right":
        return { x: 50, y: 0 }
      case "down":
        return { x: 0, y: 50 }
      case "up":
      default:
        return { x: 0, y: -50 }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...getOffset() }}
      animate={hasAnimated ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}
