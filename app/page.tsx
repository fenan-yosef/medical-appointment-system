import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

export default async function HomePage() {
  const session = await getServerSession()

  if (session?.user) {
    redirect("/dashboard/admin")
  }

  redirect("/login")
}
