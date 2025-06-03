import type { ReactNode } from "react"
import { RealTimeNotifications } from "@/components/RealTimeNotifications"

export default function DoctorLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <RealTimeNotifications />
        </>
    )
}
