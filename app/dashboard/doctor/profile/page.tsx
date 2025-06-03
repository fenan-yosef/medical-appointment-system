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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DoctorProfile {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: string
    specialization?: string
    qualifications?: string
    biography?: string
    licenseNumber?: string
    experience?: number
    department?: {
        _id: string
        name: string
    }
    availability?: Array<{
        dayOfWeek: number
        isAvailable: boolean
        startTime: string
        endTime: string
        slotDuration: number
    }>
}

interface PasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export default function DoctorProfilePage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<DoctorProfile>>({})
    const [passwordForm, setPasswordForm] = useState<PasswordForm>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [changingPassword, setChangingPassword] = useState(false)

    const daysOfWeek = [
        { value: 1, label: "Monday" },
        { value: 2, label: "Tuesday" },
        { value: 3, label: "Wednesday" },
        { value: 4, label: "Thursday" },
        { value: 5, label: "Friday" },
        { value: 6, label: "Saturday" },
        { value: 0, label: "Sunday" },
    ]

    useEffect(() => {
        if (session?.user?.role === "doctor") {
            fetchProfile()
        }
    }, [session])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/doctors/profile")
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

    const handleAvailabilityChange = (dayOfWeek: number, field: string, value: any) => {
        setFormData((prev) => {
            const availability = prev.availability || []
            const existingIndex = availability.findIndex((avail) => avail.dayOfWeek === dayOfWeek)

            if (existingIndex >= 0) {
                const updated = [...availability]
                updated[existingIndex] = { ...updated[existingIndex], [field]: value }
                return { ...prev, availability: updated }
            } else {
                const newAvailability = {
                    dayOfWeek,
                    isAvailable: field === "isAvailable" ? value : false,
                    startTime: field === "startTime" ? value : "09:00",
                    endTime: field === "endTime" ? value : "17:00",
                    slotDuration: field === "slotDuration" ? value : 30,
                }
                return { ...prev, availability: [...availability, newAvailability] }
            }
        })
    }

    const getAvailabilityForDay = (dayOfWeek: number) => {
        return formData.availability?.find((avail) => avail.dayOfWeek === dayOfWeek) || null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch("/api/doctors/profile", {
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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (passwordForm.newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters long",
                variant: "destructive",
            })
            return
        }

        setChangingPassword(true)

        try {
            const response = await fetch("/api/doctors/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                toast({
                    title: "Success",
                    description: "Password changed successfully",
                })
            } else {
                throw new Error(data.error || "Failed to change password")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to change password",
                variant: "destructive",
            })
        } finally {
            setChangingPassword(false)
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
                <h1 className="text-3xl font-bold mb-8">Doctor Profile</h1>

                <Tabs defaultValue="profile" className="space-y-8">
                    <TabsList>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="availability">Availability</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Profile Header */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <AvatarComponent
                                            firstName={profile.firstName}
                                            lastName={profile.lastName}
                                            size="xl"
                                            className="mb-4"
                                        />
                                        <h2 className="text-2xl font-bold">
                                            Dr. {profile.firstName} {profile.lastName}
                                        </h2>
                                        <p className="text-gray-600">{profile.specialization || "Doctor"}</p>
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
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            value={formData.address || ""}
                                            onChange={(e) => handleInputChange("address", e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Professional Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Professional Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="specialization">Specialization</Label>
                                            <Input
                                                id="specialization"
                                                value={formData.specialization || ""}
                                                onChange={(e) => handleInputChange("specialization", e.target.value)}
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
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={saving} className="w-full md:w-auto">
                                    {saving ? "Updating..." : "Update Profile"}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="availability">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Availability</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {daysOfWeek.map((day) => {
                                    const availability = getAvailabilityForDay(day.value)
                                    return (
                                        <div key={day.value} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-medium">{day.label}</h3>
                                                <Switch
                                                    checked={availability?.isAvailable || false}
                                                    onCheckedChange={(checked) => handleAvailabilityChange(day.value, "isAvailable", checked)}
                                                />
                                            </div>

                                            {availability?.isAvailable && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor={`start-${day.value}`}>Start Time</Label>
                                                        <Input
                                                            id={`start-${day.value}`}
                                                            type="time"
                                                            value={availability.startTime || "09:00"}
                                                            onChange={(e) => handleAvailabilityChange(day.value, "startTime", e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`end-${day.value}`}>End Time</Label>
                                                        <Input
                                                            id={`end-${day.value}`}
                                                            type="time"
                                                            value={availability.endTime || "17:00"}
                                                            onChange={(e) => handleAvailabilityChange(day.value, "endTime", e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`slot-${day.value}`}>Slot Duration (minutes)</Label>
                                                        <Select
                                                            value={availability.slotDuration?.toString() || "30"}
                                                            onValueChange={(value) =>
                                                                handleAvailabilityChange(day.value, "slotDuration", Number.parseInt(value))
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="15">15 minutes</SelectItem>
                                                                <SelectItem value="30">30 minutes</SelectItem>
                                                                <SelectItem value="45">45 minutes</SelectItem>
                                                                <SelectItem value="60">60 minutes</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                <div className="flex justify-end">
                                    <Button onClick={handleSubmit} disabled={saving}>
                                        {saving ? "Saving..." : "Save Availability"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="password">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <Input
                                            id="currentPassword"
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={changingPassword}>
                                            {changingPassword ? "Changing..." : "Change Password"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
