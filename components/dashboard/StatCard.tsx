"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    change?: {
        value: number
        type: "increase" | "decrease"
        period: string
    }
    icon: LucideIcon
    iconColor?: string
    description?: string
}

export function StatCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor = "text-blue-600",
    description,
}: StatCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                        {change && (
                            <div className="flex items-center mt-2">
                                <span
                                    className={`text-sm font-medium ${change.type === "increase" ? "text-green-600" : "text-red-600"}`}
                                >
                                    {change.type === "increase" ? "+" : "-"}
                                    {Math.abs(change.value)}%
                                </span>
                                <span className="text-sm text-gray-500 ml-1">vs {change.period}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100 ${iconColor}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
