"use client"

import type React from "react"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Add the import at the top
import { DebugInfo } from "@/components/debug-info"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                redirect: false, // Prevent automatic redirection
                email,
                password,
            })

            console.log("SignIn Result:", result) // Debugging information

            if (!result?.ok) {
                setError(result?.error || "Failed to sign in. Please check your credentials.")
                setIsLoading(false)
                return
            }

            // Fetch the latest session after login
            const sessionRes = await fetch("/api/auth/session")
            const session = await sessionRes.json()
            const role = session?.user?.role

            console.log("Session after login:", session) // Debugging information

            console.log("role:", role) // Debugging information

            if (role === "admin") {
                router.push("/dashboard/admin")
            } else if (role === "doctor") {
                router.push("/dashboard/doctor")
            } else {
                router.push("/dashboard/patient")
            }
        } catch (error: any) {
            console.error("Login error:", error)
            setError("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full">
            {/* Left side - Login Form */}
            <div className="flex w-full flex-col justify-center px-8 md:w-1/2 md:px-16 lg:px-24">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                            <div className="relative h-8 w-8">
                                <User className="absolute" size={16} strokeWidth={2} />
                                <Plus className="absolute right-0 top-0 h-4 w-4" strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">Login</h1>
                    <p className="mt-2 text-gray-600">Welcome Back to Momona Tech!</p>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-blue-700 text-white py-2 rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don&apos;t you have an account?{" "}
                        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            SignUp
                        </Link>
                    </p>
                    <DebugInfo />
                </div>
            </div>

            {/* Right side - Image */}
            <div className="hidden relative md:block md:w-1/2 bg-blue-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800/80 to-blue-900/90 z-10"></div>
                <Image
                    src="https://picsum.photos/id/1027/1200/1800"
                    alt="Healthcare professional"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="max-w-md p-8 text-white">
                        <div className="relative h-32 w-32 mx-auto mb-8 opacity-80">
                            <div className="absolute inset-0 rounded-xl bg-blue-200/30 backdrop-blur-sm"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Plus className="h-16 w-16 text-blue-200" />
                            </div>
                        </div>
                        <div className="relative h-24 w-24 mx-auto mb-8 opacity-60">
                            <div className="absolute inset-0 rounded-xl bg-blue-200/20 backdrop-blur-sm"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <User className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
