"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface PieChartData {
    name: string
    value: number
    color?: string
}

interface CustomPieChartProps {
    data: PieChartData[]
    title?: string
    height?: number
    colors?: string[]
}

const DEFAULT_COLORS = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#06B6D4", // cyan-500
    "#84CC16", // lime-500
    "#F97316", // orange-500
]

export function CustomPieChart({ data, title, height = 300, colors = DEFAULT_COLORS }: CustomPieChartProps) {
    const chartData = data.map((item, index) => ({
        ...item,
        color: item.color || colors[index % colors.length],
    }))

    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Count"]} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
