"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface FilterPanelProps {
    timeRange: string
    onTimeRangeChange: (value: string) => void
    period: string
    onPeriodChange: (value: string) => void
    metric: string
    onMetricChange: (value: string) => void
    onRefresh: () => void
    loading?: boolean
    dateRange?: {
        from: Date | undefined
        to: Date | undefined
    }
    onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export function FilterPanel({
    timeRange,
    onTimeRangeChange,
    period,
    onPeriodChange,
    metric,
    onMetricChange,
    onRefresh,
    loading = false,
    dateRange,
    onDateRangeChange,
}: FilterPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Filters & Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
                        <Select value={timeRange} onValueChange={onTimeRangeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 3 months</SelectItem>
                                <SelectItem value="365">Last year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
                        <Select value={period} onValueChange={onPeriodChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Weekly</SelectItem>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="quarter">Quarterly</SelectItem>
                                <SelectItem value="year">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Metric</label>
                        <Select value={metric} onValueChange={onMetricChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select metric" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="appointments">Appointments</SelectItem>
                                <SelectItem value="users">User Registrations</SelectItem>
                                <SelectItem value="revenue">Revenue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={onRefresh} disabled={loading} className="w-full">
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {onDateRangeChange && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Custom Date Range</label>
                        <div className="flex space-x-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? format(dateRange.from, "PPP") : "From date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange?.from}
                                        onSelect={(date) => onDateRangeChange({ from: date, to: dateRange?.to })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.to ? format(dateRange.to, "PPP") : "To date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange?.to}
                                        onSelect={(date) => onDateRangeChange({ from: dateRange?.from, to: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
