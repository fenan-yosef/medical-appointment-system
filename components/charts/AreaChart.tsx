"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface AreaChartData {
    name: string
    [key: string]: any
}

interface CustomAreaChartProps {
    data: AreaChartData[]
    title?: string
    height?: number
    areas: Array<{
        key: string
        name: string
        color: string
        fillOpacity?: number
    }>
    xAxisKey?: string
    stacked?: boolean
}

export function CustomAreaChart({
    data,
    title,
    height = 300,
    areas,
    xAxisKey = "name",
    stacked = false,
}: CustomAreaChartProps) {
    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {areas.map((area) => (
                        <Area
                            key={area.key}
                            type="monotone"
                            dataKey={area.key}
                            name={area.name}
                            stackId={stacked ? "1" : area.key}
                            stroke={area.color}
                            fill={area.color}
                            fillOpacity={area.fillOpacity || 0.6}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
