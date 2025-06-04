// Using a simple in-memory map for SSE connections.
// For production, consider a more robust solution like Redis if scaling across multiple server instances.
const sseConnections = new Map<string, ReadableStreamDefaultController>();

export function addSseConnection(userId: string, controller: ReadableStreamDefaultController): void {
    sseConnections.set(userId, controller);
    console.log(`SSE connection added for user: ${userId}. Total connections: ${sseConnections.size}`);
}

export function removeSseConnection(userId: string): void {
    if (sseConnections.has(userId)) {
        const controller = sseConnections.get(userId);
        try {
            if (controller) { // Check if controller exists before trying to close
                // controller.close(); // Controller is closed by the stream itself on abort
            }
        } catch (error) {
            // console.error(`Error closing controller for user ${userId}:`, error);
            // It might already be closed or in a state that doesn't allow closing.
        }
        sseConnections.delete(userId);
        console.log(`SSE connection removed for user: ${userId}. Total connections: ${sseConnections.size}`);
    }
}

export function sendNotificationToUser(userId: string, notification: any): void {
    if (sseConnections.has(userId)) {
        const controller = sseConnections.get(userId);
        if (controller) {
            try {
                controller.enqueue(`data: ${JSON.stringify({ type: "notification", data: notification })}\n\n`);
                console.log(`Sent notification to user: ${userId}`);
            } catch (error) {
                console.error(`Error sending notification to user ${userId}:`, error);
                // Potentially remove a broken connection
                removeSseConnection(userId);
            }
        }
    } else {
        console.log(`No active SSE connection found for user: ${userId} to send notification.`);
    }
}

// Optional: A function to get the count of active connections for monitoring
export function getActiveSseConnectionCount(): number {
    return sseConnections.size;
}
