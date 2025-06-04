// Extend the global namespace to include our SSE connections
declare global {
    var sseConnections: Map<string, ReadableStreamDefaultController> | undefined
}

import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { addSseConnection, removeSseConnection } from "@/lib/sseService"; // Import SSE service functions

// Server-Sent Events endpoint for real-time notifications
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) { // Ensure session.user.id exists
        return new Response("Unauthorized", { status: 401 })
    }

    const currentUserId = session.user.id; // Use ID from authenticated session

    // Optional: If you still want to allow specifying userId via query param for some reason,
    // ensure it matches the authenticated user. But typically, you'd use the session user's ID.
    // const { searchParams } = new URL(request.url);
    // const queryUserId = searchParams.get("userId");
    // if (queryUserId && queryUserId !== currentUserId) {
    //     return new Response("Forbidden: userId parameter does not match authenticated user.", { status: 403 });
    // }


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
                try {
                    controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`)
                } catch (error) {
                    console.error(`Error sending heartbeat to user ${currentUserId}:`, error);
                    clearInterval(heartbeat);
                    removeSseConnection(currentUserId);
                    // controller.close(); // Controller will be closed by abort signal or error
                }
            }, 30000)

            // Store the controller using the service
            addSseConnection(currentUserId, controller);

            // Clean up on close
            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeat)
                removeSseConnection(currentUserId)
                // controller.close(); // The stream itself handles closing the controller on abort.
                console.log(`SSE connection aborted by client for user: ${currentUserId}`);
            })
        },
        cancel(reason) {
            // This is called if the stream is cancelled by the consumer (e.g. client disconnects)
            console.log(`SSE stream cancelled for user ${currentUserId}. Reason:`, reason);
            removeSseConnection(currentUserId);
        }
    })

    return new Response(stream, { headers })
}
