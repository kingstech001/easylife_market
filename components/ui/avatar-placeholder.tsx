import { getInitials } from "@/lib/utils"

interface AvatarPlaceholderProps {
  name: string
  className?: string
}

export function AvatarPlaceholder({ name, className = "" }: AvatarPlaceholderProps) {
  const initials = getInitials(name)

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium ${className}`}
    >
      {initials}
    </div>
  )
}
