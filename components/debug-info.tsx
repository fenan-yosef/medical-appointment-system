"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugInfo() {
    const [info, setInfo] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const checkConnection = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/test-user")
            const data = await response.json()

            setInfo({
                mongoConnection: "Success",
                testUser: data,
            })
        } catch (err: any) {
            setError(err.message || "Failed to check connection")
            setInfo(null)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
                <Button variant="outline" size="sm" onClick={checkConnection} disabled={loading}>
                    {loading ? "Checking..." : "Check Connection"}
                </Button>

                {error && <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded">Error: {error}</div>}

                {info && (
                    <pre className="mt-2 p-2 bg-gray-50 text-xs rounded overflow-auto max-h-40">
                        {JSON.stringify(info, null, 2)}
                    </pre>
                )}
            </CardContent>
        </Card>
    )
}
