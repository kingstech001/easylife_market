"use client"

import type React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type MotionDivProps = React.ComponentPropsWithoutRef<typeof motion.div>

interface AnimatedContainerProps extends Omit<MotionDivProps, "children"> {
  children: React.ReactNode
  delay?: number
  duration?: number
  animation?: "fadeIn" | "slideUp" | "slideIn" | "scale" | "none"
}

export function AnimatedContainer({
  children,
  delay = 0,
  duration = 0.5,
  animation = "fadeIn",
  className,
  ...props
}: AnimatedContainerProps) {
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration, delay },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration, delay },
    },
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, delay },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration, delay },
    },
    none: {},
  }

  const selectedAnimation = animations[animation]

  return (
    <motion.div className={cn(className)} {...selectedAnimation} {...(props as MotionDivProps)}>
      {children}
    </motion.div>
  )
}
