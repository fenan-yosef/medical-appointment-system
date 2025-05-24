import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth/next"
import { SessionProvider } from "@/components/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Momona Tech - Healthcare Management System",
  description: "A comprehensive healthcare management system",
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
      </body>
    </html>
  )
}
