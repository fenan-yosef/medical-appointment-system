"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import useEffect
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react" // Keep ChevronLeft, remove other icon imports if no longer needed

// Updated Specialty interface (no icon)
interface Specialty {
    id: string // Corresponds to department._id
    name: string
}

// Interface for the department data from the API
interface ApiDepartment {
    _id: string
    name: string
    description?: string // Include other fields if needed
}

export default function BookAppointmentSpecialty() {
    const router = useRouter()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
    const [specialties, setSpecialties] = useState<Specialty[]>([]) // Initialize as empty array
    const [loading, setLoading] = useState(true) // Add loading state

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true)
            try {
                const response = await fetch("/api/departments")
                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.message || "Failed to fetch departments")
                }
                const data = await response.json() // Expects { departments: ApiDepartment[] }

                if (data.departments && Array.isArray(data.departments)) {
                    const mappedSpecialties: Specialty[] = data.departments.map((dept: ApiDepartment) => ({
                        id: dept._id,
                        name: dept.name,
                    }))
                    setSpecialties(mappedSpecialties)
                } else {
                    setSpecialties([])
                    toast({
                        title: "Info",
                        description: "No departments found or data format is incorrect.",
                        variant: "default",
                    })
                }
            } catch (error) {
                console.error("Error fetching departments:", error)
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Could not fetch specialties.",
                    variant: "destructive",
                })
                setSpecialties([]) // Set to empty array on error
            } finally {
                setLoading(false)
            }
        }

        fetchDepartments()
    }, [toast]) // toast is a dependency of the effect

    const filteredSpecialties = specialties.filter((specialty) =>
        specialty.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const handleSpecialtySelect = (specialtyId: string) => {
        setSelectedSpecialty(specialtyId)
        // Navigate to the doctor selection page, passing the department ID as 'specialty'
        router.push(`/dashboard/patient/appointments/book/doctor?specialty=${specialtyId}`)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push("/dashboard/patient")} className="mb-4">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="flex items-center">
                    <div className="text-sm text-gray-500">
                        <span>Appointment</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-black">Specialty</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">What type of care do you need?</h1>
                <p className="text-gray-600 mb-6">Choose a specialty to find the right doctor for your needs.</p>

                <div className="mb-6">
                    <Input
                        type="text"
                        placeholder="Search specialties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                <h2 className="text-lg font-medium mb-4">Select a specialty</h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6 flex items-center justify-center text-center h-24">
                                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredSpecialties.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No specialties found matching your search or none available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSpecialties.map((specialty) => (
                            <div
                                key={specialty.id}
                                onClick={() => handleSpecialtySelect(specialty.id)}
                                role="button" // Added for accessibility
                                tabIndex={0} // Added for accessibility
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSpecialtySelect(specialty.id) }} // Added for accessibility
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                            >
                                <Card
                                    className={`cursor-pointer transition-all hover:border-blue-500 h-full flex flex-col justify-center ${selectedSpecialty === specialty.id ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200"
                                        }`}
                                >
                                    <CardContent className="p-6 flex items-center justify-center text-center">
                                        <span className="font-semibold text-md">{specialty.name}</span>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <Button
                        onClick={() => {
                            if (selectedSpecialty) {
                                router.push(`/dashboard/patient/appointments/book/doctor?specialty=${selectedSpecialty}`)
                            } else {
                                toast({
                                    title: "Please select a specialty",
                                    variant: "destructive",
                                })
                            }
                        }}
                        className="w-full md:w-auto"
                        disabled={!selectedSpecialty || loading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
