// Real-time notification service using Server-Sent Events
export class RealTimeService {
    private static eventSource: EventSource | null = null
    private static listeners: Map<string, (data: any) => void> = new Map()

    static connect(userId: string) {
        if (this.eventSource) {
            this.eventSource.close()
        }

        this.eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`)

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                this.notifyListeners(data.type, data)
            } catch (error) {
                console.error("Error parsing SSE data:", error)
            }
        }

        this.eventSource.onerror = (error) => {
            console.error("SSE connection error:", error)
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                this.connect(userId)
            }, 5000)
        }
    }

    static disconnect() {
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
        }
        this.listeners.clear()
    }

    static subscribe(eventType: string, callback: (data: any) => void) {
        this.listeners.set(eventType, callback)
    }

    static unsubscribe(eventType: string) {
        this.listeners.delete(eventType)
    }

    private static notifyListeners(eventType: string, data: any) {
        const callback = this.listeners.get(eventType)
        if (callback) {
            callback(data)
        }

        // Also notify global listeners
        const globalCallback = this.listeners.get("*")
        if (globalCallback) {
            globalCallback({ type: eventType, data })
        }
    }
}
