"use client"

import type React from "react"

import { motion, type MotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  delay?: number
  duration?: number
  animation?: "fadeIn" | "slideUp" | "slideIn" | "scale" | "none"
  motionProps?: MotionProps
}

export function AnimatedContainer({
  children,
  delay = 0,
  duration = 0.5,
  animation = "fadeIn",
  className,
  motionProps,
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
    <motion.div className={cn(className)} {...selectedAnimation} {...motionProps} {...props}>
      {children}
    </motion.div>
  )
}
