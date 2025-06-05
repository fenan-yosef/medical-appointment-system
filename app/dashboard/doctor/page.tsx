"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AvatarComponent } from "@/components/ui/avatar-component"
import { useToast } from "@/hooks/use-toast"
import {
    Calendar,
    Clock,
    Phone,
    Mail,
    User,
    CheckCircle,
    XCircle,
    FileText,
    Bell,
    Filter,
    RefreshCw,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Appointment {
    _id: string
    patient: {
        _id: string
        firstName: string
        lastName: string
        email: string
        phone?: string
    }
    department: {
        _id: string
        name: string
    }
    date: string
    time: {
        start: string
        end: string
    }
    status: string
    reason: string
    notes?: string
    doctorNotes?: string
    type: string
}

interface AppointmentStats {
    today: number
    upcoming: number
}

// Custom Dialog Components
const Dialog = ({
    open,
    onOpenChange,
    children,
}: {
    open: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}) => {
    if (!open) return null

    const handleBackdropClick = () => {
        onOpenChange?.(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={handleBackdropClick} />
            <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {children}
            </div>
        </div>
    )
}

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return <div className={`p-6 ${className || ""}`}>{children}</div>
}

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
    return <div className="mb-4">{children}</div>
}

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
    return <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
}

const DialogFooter = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex justify-end space-x-2 mt-6">{children}</div>
}

export default function DoctorDashboard() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [stats, setStats] = useState<AppointmentStats>({ today: 0, upcoming: 0 })
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [notesDialogOpen, setNotesDialogOpen] = useState(false)
    const [doctorNotes, setDoctorNotes] = useState("")
    const [activeTab, setActiveTab] = useState("today")

    useEffect(() => {
        if (session?.user?.role === "doctor") {
            fetchAppointments()
        }
    }, [session, statusFilter, activeTab])

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                status: getStatusForTab(activeTab),
                sortBy: "date",
                sortOrder: "asc",
            })

            if (activeTab === "today") {
                params.append("date", new Date().toISOString().split("T")[0])
            }

            const response = await fetch(`/api/doctors/appointments?${params}`)
            const data = await response.json()

            console.log("Fetched appointments:", data)

            if (data.success) {
                setAppointments(data.data)
                setStats(data.stats)
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch appointments",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch appointments",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const getStatusForTab = (tab: string) => {
        switch (tab) {
            case "today":
                return "all"; // Or perhaps a specific status like "scheduled" if you only want scheduled appointments for today
            case "upcoming":
                return "scheduled"; // Only fetch scheduled appointments for upcoming
            case "completed":
                return "completed";
            case "cancelled":
                return "cancelled";
            default:
                return "all";
        }
    }

    const updateAppointmentStatus = async (appointmentId: string, status: string) => {
        try {
            const response = await fetch(`/api/doctors/appointments/${appointmentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            })

            const data = await response.json()

            if (data.success) {
                setAppointments((prev) => prev.map((apt) => (apt._id === appointmentId ? data.data : apt)))
                toast({
                    title: "Success",
                    description: `Appointment marked as ${status}`,
                })
            } else {
                throw new Error(data.error || "Failed to update appointment")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update appointment",
                variant: "destructive",
            })
        }
    }

    const saveNotes = async () => {
        if (!selectedAppointment) return

        try {
            const response = await fetch(`/api/doctors/appointments/${selectedAppointment._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ doctorNotes }),
            })

            const data = await response.json()

            if (data.success) {
                setAppointments((prev) => prev.map((apt) => (apt._id === selectedAppointment._id ? data.data : apt)))
                setNotesDialogOpen(false)
                toast({
                    title: "Success",
                    description: "Notes saved successfully",
                })
            } else {
                throw new Error(data.error || "Failed to save notes")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save notes",
                variant: "destructive",
            })
        }
    }

    const openNotesDialog = (appointment: Appointment) => {
        setSelectedAppointment(appointment)
        setDoctorNotes(appointment.doctorNotes || "")
        setNotesDialogOpen(true)
    }

    const openDetailsDialog = (appointment: Appointment) => {
        setSelectedAppointment(appointment)
        setDetailsDialogOpen(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":")
        const hour = Number.parseInt(hours)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            scheduled: { variant: "secondary" as const, label: "Scheduled", className: "" },
            confirmed: { variant: "default" as const, label: "Confirmed", className: "" },
            completed: { variant: "default" as const, label: "Completed", className: "bg-green-100 text-green-800" },
            cancelled: { variant: "secondary" as const, label: "Cancelled", className: "bg-red-100 text-red-800" },
            "no-show": { variant: "secondary" as const, label: "No Show", className: "bg-yellow-100 text-yellow-800" },
            rescheduled: { variant: "secondary" as const, label: "Rescheduled", className: "bg-blue-100 text-blue-800" },
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled

        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
                    <p className="text-gray-600">Welcome back, Dr. {session?.user?.name}</p>
                </div>
                <Button onClick={fetchAppointments} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                                <p className="text-2xl font-bold">{stats.today}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                                <p className="text-2xl font-bold">{stats.upcoming}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Bell className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total</p>
                                <p className="text-2xl font-bold">3</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Appointments</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="no-show">No Show</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-6">
                            <TabsTrigger value="today">Today</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                        </TabsList>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-24 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No appointments found</p>
                            </div>
                        ) : (
                            <TabsContent value={activeTab}>
                                <div className="space-y-4">
                                    {appointments.map((appointment) => (
                                        <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <AvatarComponent
                                                            firstName={appointment.patient?.firstName || "unknown"}
                                                            lastName={appointment.patient?.lastName || "patient"}
                                                            size="lg"
                                                        />
                                                        <div>
                                                            <h3 className="font-semibold text-lg">
                                                                {appointment.patient?.firstName} {appointment.patient?.lastName}
                                                            </h3>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 mr-1" />
                                                                    {formatDate(appointment.date)}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="h-4 w-4 mr-1" />
                                                                    {formatTime(appointment.time.start)}
                                                                </div>
                                                                {appointment.patient?.phone && (
                                                                    <div className="flex items-center">
                                                                        <Phone className="h-4 w-4 mr-1" />
                                                                        {appointment.patient?.phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-700 mt-2">{appointment.reason}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        {getStatusBadge(appointment.status)}
                                                        <div className="flex space-x-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openDetailsDialog(appointment)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <User className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openNotesDialog(appointment)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                            {appointment.status === "scheduled" && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateAppointmentStatus(appointment._id, "completed")}
                                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateAppointmentStatus(appointment._id, "no-show")}
                                                                        className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </CardContent>
            </Card>

            {/* Patient Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Patient Details</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <AvatarComponent
                                    firstName={selectedAppointment.patient?.firstName}
                                    lastName={selectedAppointment.patient?.lastName}
                                    size="xl"
                                />
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                                    </h3>
                                    <p className="text-gray-600">{selectedAppointment.department.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                                    <div className="flex items-center mt-1">
                                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{selectedAppointment.patient?.email}</span>
                                    </div>
                                </div>
                                {selectedAppointment.patient?.phone && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Phone</Label>
                                        <div className="flex items-center mt-1">
                                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{selectedAppointment.patient?.phone}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-500">Appointment Details</Label>
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Date:</span> {formatDate(selectedAppointment.date)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Time:</span> {formatTime(selectedAppointment.time.start)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Type:</span> {selectedAppointment.type}
                                        </div>
                                        <div>
                                            <span className="font-medium">Status:</span> {selectedAppointment.status}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <span className="font-medium">Reason:</span>
                                        <p className="mt-1">{selectedAppointment.reason}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Notes Dialog */}
            <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Private Notes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="doctorNotes">Doctor's Notes (Private)</Label>
                            <Textarea
                                id="doctorNotes"
                                value={doctorNotes}
                                onChange={(e) => setDoctorNotes(e.target.value)}
                                rows={6}
                                placeholder="Add your private notes about this appointment..."
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveNotes}>Save Notes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
