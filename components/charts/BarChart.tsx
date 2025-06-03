"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface BarChartData {
    name: string
    [key: string]: any
}

interface CustomBarChartProps {
    data: BarChartData[]
    title?: string
    height?: number
    dataKeys: Array<{
        key: string
        name: string
        color: string
    }>
    xAxisKey?: string
}

export function CustomBarChart({ data, title, height = 300, dataKeys, xAxisKey = "name" }: CustomBarChartProps) {
    return (
        <div className="w-full">
            {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {dataKeys.map((dataKey) => (
                        <Bar key={dataKey.key} dataKey={dataKey.key} name={dataKey.name} fill={dataKey.color} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
