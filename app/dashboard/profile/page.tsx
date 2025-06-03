"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarComponent } from "@/components/ui/avatar-component"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserProfile {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: string
    role: string
    specialization?: string
    qualifications?: string
    biography?: string
    licenseNumber?: string
    experience?: number
    department?: {
        _id: string
        name: string
    }
    dateOfBirth?: string
    gender?: string
    emergencyContact?: {
        name: string
        phone: string
        relationship: string
    }
    availability?: {
        daysAvailable: string[]
        timeSlots: string[]
    }
}

export default function ProfilePage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<UserProfile>>({})

    useEffect(() => {
        if (session?.user) {
            fetchProfile()
        }
    }, [session])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/profile")
            const data = await response.json()

            if (data.success) {
                setProfile(data.data)
                setFormData(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch profile",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch profile",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [parentField]: {
                ...((prev as any)[parentField] || {}),
                [childField]: value,
            },
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                setProfile(data.data)
                toast({
                    title: "Success",
                    description: "Profile updated successfully",
                })
            } else {
                throw new Error(data.error || "Failed to update profile")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const getRoleTitle = (role: string) => {
        switch (role) {
            case "doctor":
                return "Doctor"
            case "patient":
                return "Patient"
            case "admin":
                return "Administrator"
            case "receptionist":
                return "Receptionist"
            default:
                return "User"
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="space-y-6">
                            <div className="h-32 bg-gray-200 rounded"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-gray-500">Profile not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Profile</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Profile Header */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <AvatarComponent firstName={profile.firstName} lastName={profile.lastName} size="xl" className="mb-4" />
                                <h2 className="text-2xl font-bold">
                                    {profile.role === "doctor" ? "Dr. " : ""}
                                    {profile.firstName} {profile.lastName}
                                </h2>
                                <p className="text-gray-600">
                                    {profile.role === "doctor" && profile.specialization
                                        ? profile.specialization
                                        : getRoleTitle(profile.role)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName || ""}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName || ""}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone || ""}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                    />
                                </div>
                                {profile.role === "patient" && (
                                    <div>
                                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth || ""}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address || ""}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    rows={3}
                                />
                            </div>

                            {profile.role === "patient" && (
                                <div>
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender || ""} onValueChange={(value) => handleInputChange("gender", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Professional Information - Only for Doctors */}
                    {profile.role === "doctor" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Professional Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="specialization">Specialty</Label>
                                        <Input
                                            id="specialization"
                                            value={formData.specialization || ""}
                                            onChange={(e) => handleInputChange("specialization", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="licenseNumber">License Number</Label>
                                        <Input
                                            id="licenseNumber"
                                            value={formData.licenseNumber || ""}
                                            onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="qualifications">Qualifications</Label>
                                    <Textarea
                                        id="qualifications"
                                        value={formData.qualifications || ""}
                                        onChange={(e) => handleInputChange("qualifications", e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="biography">Biography</Label>
                                    <Textarea
                                        id="biography"
                                        value={formData.biography || ""}
                                        onChange={(e) => handleInputChange("biography", e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="experience">Years of Experience</Label>
                                    <Input
                                        id="experience"
                                        type="number"
                                        value={formData.experience || ""}
                                        onChange={(e) => handleInputChange("experience", Number.parseInt(e.target.value))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Emergency Contact - For Patients */}
                    {profile.role === "patient" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Emergency Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="emergencyContactName">Contact Name</Label>
                                        <Input
                                            id="emergencyContactName"
                                            value={formData.emergencyContact?.name || ""}
                                            onChange={(e) => handleNestedInputChange("emergencyContact", "name", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                                        <Input
                                            id="emergencyContactPhone"
                                            value={formData.emergencyContact?.phone || ""}
                                            onChange={(e) => handleNestedInputChange("emergencyContact", "phone", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                                    <Input
                                        id="emergencyContactRelationship"
                                        value={formData.emergencyContact?.relationship || ""}
                                        onChange={(e) => handleNestedInputChange("emergencyContact", "relationship", e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Availability - For Doctors */}
                    {profile.role === "doctor" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Availability</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Days Available</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                            <label key={day} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.availability?.daysAvailable?.includes(day) || false}
                                                    onChange={(e) => {
                                                        const currentDays = formData.availability?.daysAvailable || []
                                                        const newDays = e.target.checked
                                                            ? [...currentDays, day]
                                                            : currentDays.filter((d) => d !== day)
                                                        handleNestedInputChange("availability", "daysAvailable", newDays)
                                                    }}
                                                />
                                                <span className="text-sm">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="timeSlots">Time Slots</Label>
                                    <Textarea
                                        id="timeSlots"
                                        placeholder="e.g., 9:00 AM - 12:00 PM, 2:00 PM - 5:00 PM"
                                        value={formData.availability?.timeSlots?.join(", ") || ""}
                                        onChange={(e) => handleNestedInputChange("availability", "timeSlots", e.target.value.split(", "))}
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving} className="w-full md:w-auto">
                            {saving ? "Updating..." : "Update Profile"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
