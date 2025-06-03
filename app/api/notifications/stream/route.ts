// Extend the global namespace to include our SSE connections
declare global {
    var sseConnections: Map<string, ReadableStreamDefaultController> | undefined
}

import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Server-Sent Events endpoint for real-time notifications
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (userId !== session.user.id) {
        return new Response("Forbidden", { status: 403 })
    }

    // Set up SSE headers
    const headers = new Headers({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
    })

    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection message
            controller.enqueue(`data: ${JSON.stringify({ type: "connected", message: "Connected to notifications" })}\n\n`)

            // Keep connection alive with periodic heartbeat
            const heartbeat = setInterval(() => {
                controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`)
            }, 30000)

            // Store the controller for sending notifications
            // In a real application, you would store this in a global map or Redis
            // For this example, we'll use a simple in-memory store
            if (!globalThis.sseConnections) {
                globalThis.sseConnections = new Map()
            }
            globalThis.sseConnections.set(userId, controller)

            // Clean up on close
            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeat)
                globalThis.sseConnections?.delete(userId)
                controller.close()
            })
        },
    })

    return new Response(stream, { headers })
}

// Helper function to send notifications to connected clients
export function sendNotificationToUser(userId: string, notification: any) {
    if (globalThis.sseConnections?.has(userId)) {
        const controller = globalThis.sseConnections.get(userId)
        try {
            controller?.enqueue(`data: ${JSON.stringify({ type: "notification", data: notification })}\n\n`)
        } catch (error) {
            console.error("Error sending notification:", error)
            globalThis.sseConnections.delete(userId)
        }
    }
}
