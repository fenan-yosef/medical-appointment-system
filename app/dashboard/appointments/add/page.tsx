"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AddAppointmentPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        age: "",
        sex: "",
        phone: "",
        address: "",
        extraNote: "",
        appointSchedule: true,
        department: "",
        doctor: "",
        date: "",
    })

    // Mock data for departments and doctors
    const departments = [
        { id: "1", name: "Cardiology" },
        { id: "2", name: "Neurology" },
        { id: "3", name: "Orthopedics" },
        { id: "4", name: "Pediatrics" },
        { id: "5", name: "Dermatology" },
    ]

    const doctors = [
        { id: "1", name: "Dr. Smith", departmentId: "1" },
        { id: "2", name: "Dr. Johnson", departmentId: "2" },
        { id: "3", name: "Dr. Williams", departmentId: "3" },
        { id: "4", name: "Dr. Brown", departmentId: "4" },
        { id: "5", name: "Dr. Davis", departmentId: "5" },
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, appointSchedule: checked }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // In a real app, you would send this data to your API
            console.log("Form data:", formData)

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Redirect to appointments list
            router.push("/appointments")
        } catch (error) {
            console.error("Error submitting form:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Add Appointment</h1>
                <div className="text-sm breadcrumbs">
                    <ul className="flex items-center space-x-2">
                        <li>
                            <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
                                Dashboard
                            </a>
                        </li>
                        <span className="text-gray-400">/</span>
                        <li>
                            <a href="/appointments" className="text-gray-500 hover:text-gray-700">
                                Appointments
                            </a>
                        </li>
                        <span className="text-gray-400">/</span>
                        <li className="text-gray-900">Add Appointment</li>
                    </ul>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Patient Information</CardTitle>
                    <CardDescription>Enter the patient details to schedule an appointment</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Patient Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium">
                                    First Name
                                </label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium">
                                    Last Name
                                </label>
                                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="age" className="text-sm font-medium">
                                    Age
                                </label>
                                <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="sex" className="text-sm font-medium">
                                    Sex
                                </label>
                                <Select
                                    value={formData.sex}
                                    onValueChange={(value: string) => handleSelectChange("sex", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue>Select gender</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium">
                                    Phone
                                </label>
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="address" className="text-sm font-medium">
                                    Address
                                </label>
                                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="extraNote" className="text-sm font-medium">
                                Extra Note
                            </label>
                            <Textarea
                                id="extraNote"
                                name="extraNote"
                                value={formData.extraNote}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="appointSchedule"
                                checked={formData.appointSchedule}
                                onCheckedChange={handleCheckboxChange}
                            />
                            <label
                                htmlFor="appointSchedule"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Appoint Schedule
                            </label>
                        </div>

                        {/* Appointment Details */}
                        {formData.appointSchedule && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div className="space-y-2">
                                    <label htmlFor="department" className="text-sm font-medium">
                                        Department
                                    </label>
                                    <Select
                                        value={formData.department}
                                        onValueChange={(value: string) => handleSelectChange("department", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>-- Select Department --</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="doctor" className="text-sm font-medium">
                                        Doctor
                                    </label>
                                    <Select
                                        value={formData.doctor}
                                        onValueChange={(value: string) => handleSelectChange("doctor", value)}
                                        disabled={!formData.department}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>-- Select Doctor --</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors
                                                .filter((doc) => !formData.department || doc.departmentId === formData.department)
                                                .map((doc) => (
                                                    <SelectItem key={doc.id} value={doc.id}>
                                                        {doc.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="date" className="text-sm font-medium">
                                        Date
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="date"
                                            name="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="pl-10"
                                        />
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-gray-100 pt-6">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
