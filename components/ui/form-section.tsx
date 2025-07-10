import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  icon?: LucideIcon
  className?: string
}

export function FormSection({ title, description, children, icon: Icon, className }: FormSectionProps) {
  return (
    <Card className={cn("border-border/40 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}
