import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import DeviceAnalytics from "@/components/DeviceAnalytics"
import { SessionProvider } from "@/components/session-provider"
import { getServerSession } from "next-auth"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
        <DeviceAnalytics />
      </body>
    </html>
  )
}
