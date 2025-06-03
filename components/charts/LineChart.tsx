"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface LineChartData {
    name: string
    [key: string]: any
}

interface CustomLineChartProps {
    data: LineChartData[]
    title?: string
    height?: number
    lines: Array<{
        key: string
        name: string
        color: string
        strokeWidth?: number
    }>
    xAxisKey?: string
}

export function CustomLineChart({ data, title, height = 300, lines, xAxisKey = "name" }: CustomLineChartProps) {
    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {lines.map((line) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={line.strokeWidth || 2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
