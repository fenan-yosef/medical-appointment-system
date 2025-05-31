"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react"

interface Doctor {
    _id: string
    firstName: string
    lastName: string
    email: string
    specialization: string
    department: {
        _id: string
        name: string
    }
}

export default function BookAppointmentDoctor() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const specialty = searchParams?.get("specialty")
    const { toast } = useToast()

    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)

    useEffect(() => {
        if (!specialty) {
            router.push("/dashboard/patient/appointments/book")
            return
        }

        fetchDoctors()
    }, [specialty])

    const fetchDoctors = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/patients/doctors?specialty=${specialty}`)
            const data = await response.json()

            if (data.success) {
                setDoctors(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch doctors",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch doctors",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const filteredDoctors = doctors.filter((doctor) =>
        `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const handleDoctorSelect = (doctorId: string) => {
        setSelectedDoctor(doctorId)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push("/dashboard/patient/appointments/book")} className="mb-4">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="flex items-center">
                    <div className="text-sm text-gray-500">
                        <span>Specialty</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-black">Doctor</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Choose a doctor</h1>
                <p className="text-gray-600 mb-6">Select a doctor from the list below</p>

                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Search doctors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                <h2 className="text-lg font-medium mb-4">Available doctors</h2>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No doctors found for this specialty</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredDoctors.map((doctor) => (
                            <Card
                                key={doctor._id}
                                className={`cursor-pointer transition-all hover:border-blue-500 ${selectedDoctor === doctor._id ? "border-blue-500 ring-2 ring-blue-500" : ""
                                    }`}
                            >
                                <div // Wrap CardContent with a div
                                    onClick={() => handleDoctorSelect(doctor._id)} // Apply onClick to the div
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Avatar className="h-12 w-12 mr-4">
                                                    <AvatarImage
                                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${doctor.firstName}%20${doctor.lastName}`}
                                                    />
                                                    <AvatarFallback>{getInitials(doctor.firstName, doctor.lastName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-medium">
                                                        Dr. {doctor.firstName} {doctor.lastName}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {doctor.specialization || doctor.department?.name || "General Practitioner"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant={selectedDoctor === doctor._id ? "default" : "outline"}
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedDoctor(doctor._id)
                                                    router.push(
                                                        `/dashboard/patient/appointments/book/date?specialty=${specialty}&doctor=${doctor._id}`,
                                                    )
                                                }}
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <Button
                        onClick={() => {
                            if (selectedDoctor) {
                                router.push(`/dashboard/patient/appointments/book/date?specialty=${specialty}&doctor=${selectedDoctor}`)
                            } else {
                                toast({
                                    title: "Please select a doctor",
                                    variant: "destructive",
                                })
                            }
                        }}
                        className="w-full md:w-auto"
                        disabled={!selectedDoctor}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
