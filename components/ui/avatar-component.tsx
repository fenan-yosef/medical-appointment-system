"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarComponentProps {
    src?: string
    alt?: string
    firstName?: string
    lastName?: string
    size?: "sm" | "md" | "lg" | "xl"
    className?: string
}

export function AvatarComponent({ src, alt, firstName, lastName, size = "md", className }: AvatarComponentProps) {
    const [imageError, setImageError] = useState(false)

    const getInitials = () => {
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
        }
        if (firstName) {
            return firstName.charAt(0).toUpperCase()
        }
        return "U"
    }

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-16 w-16 text-lg",
        xl: "h-24 w-24 text-xl",
    }

    const avatarSrc = !imageError && src ? src : `https://api.dicebear.com/7.x/initials/svg?seed=${getInitials()}`

    return (
        <Avatar className={`${sizeClasses[size]} ${className}`}>
            <AvatarImage
                src={avatarSrc || "/placeholder.svg"}
                alt={alt || `${firstName} ${lastName}`}
                onError={() => setImageError(true)}
            />
            <AvatarFallback className="bg-blue-500 text-white font-medium">{getInitials()}</AvatarFallback>
        </Avatar>
    )
}
