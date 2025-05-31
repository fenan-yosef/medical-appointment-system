"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    value: string
    onValueChange: (value: string) => void
}

interface SelectTriggerProps {
    children: React.ReactNode
    className?: string
}

interface SelectValueProps {
    placeholder?: string
    children?: React.ReactNode
}

interface SelectContentProps {
    children: React.ReactNode
    className?: string
}

interface SelectItemProps {
    value: string
    children: React.ReactNode
    onSelect?: () => void
}

export function Select({ value, onValueChange, children, className = "", ...props }: SelectProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onValueChange(e.target.value)
    }

    return (
        <select
            value={value}
            onChange={handleChange}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            {...props}
        >
            {children}
        </select>
    )
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
    // For your current implementation, this just returns the children
    // since the actual select element handles the trigger functionality
    return <>{children}</>
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
    // This is typically used with more complex select components
    // For native select, we'll just return the children or placeholder
    return <>{children || placeholder}</>
}

export function SelectContent({ children, className }: SelectContentProps) {
    // For native select, this just returns the children (options)
    return <>{children}</>
}

export function SelectItem({ value, children, onSelect }: SelectItemProps) {
    return (
        <option value={value} onClick={onSelect}>
            {children}
        </option>
    )
}
