"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, Plus, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        gender: "prefer not to say", // Default value
        dateOfBirth: "",
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setError("")
        setSuccess("")
    }

    const validateForm = () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.dateOfBirth) {
            setError("Please fill in all required fields")
            return false
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return false
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long")
            return false
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address")
            return false
        }

        if (!formData.gender) { // Check if gender is selected
            setError("Please select a gender")
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        if (!validateForm()) {
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber,
                    gender: formData.gender,
                    dateOfBirth: formData.dateOfBirth,
                    role: "patient", // Default role for registration
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Registration failed. Please try again.")
                setIsLoading(false)
                return
            }

            setSuccess("Registration successful! Redirecting to login...")
            setTimeout(() => {
                router.push("/login")
            }, 2000)
        } catch (error: any) {
            console.error("Registration error:", error)
            setError("An unexpected error occurred. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full">
            {/* Left side - Registration Form */}
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

                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="mt-2 text-gray-600">Join SDLB Tech Healthcare Platform</p>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mt-4 border-green-200 bg-green-50 text-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                                    First Name *
                                </Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                                    Last Name *
                                </Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email Address *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john.doe@example.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                required
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                                Phone Number
                            </Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={formData.phoneNumber}
                                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                                    Gender *
                                </Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => handleInputChange("gender", value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                                    Date of Birth *
                                </Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                    required
                                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password *
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                required
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                Confirm Password *
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                required
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side - Image */}
            <div className="hidden relative md:block md:w-1/2 bg-blue-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800/80 to-blue-900/90 z-10"></div>
                <Image
                    // src="https://picsum.photos/id/1040/1200/1800"
                    src="/registration-image.png"
                    alt="Healthcare registration"
                    fill
                    // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="relative w-full h-full max-w-2xl">
                        <Image
                            src="/female-doctor.png"
                            alt="Healthcare registration"
                            width={1000} // Adjust width as needed
                            height={800} // Adjust height as needed to maintain aspect ratio
                            style={{
                                width: '100%',
                                height: 'auto',
                                objectFit: 'cover',
                            }}
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
                {/* <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="max-w-md p-8 text-white text-center">
                        <div className="relative h-32 w-32 mx-auto mb-8 opacity-80">
                            <div className="absolute inset-0 rounded-xl bg-blue-200/30 backdrop-blur-sm"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Plus className="h-16 w-16 text-blue-200" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Welcome to Healthcare</h2>
                        <p className="text-blue-100 leading-relaxed">
                            Join thousands of patients who trust our platform for their healthcare needs. Experience seamless
                            appointment booking and comprehensive medical care.
                        </p>
                        <div className="relative h-24 w-24 mx-auto mt-8 opacity-60">
                            <div className="absolute inset-0 rounded-xl bg-blue-200/20 backdrop-blur-sm"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <User className="h-12 w-12 text-blue-200" />
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    )
}
