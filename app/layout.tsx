import type { Metadata } from "next"
import "./globals.css"
import DeviceAnalytics from "@/components/DeviceAnalytics"
import { SessionProvider } from "@/components/session-provider"
import { getServerSession } from "next-auth"

export const metadata: Metadata = {
  title: "Medical Appointment System",
  description: "Schedule and manage medical appointments.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
        <DeviceAnalytics />
      </body>
    </html>
  )
}
