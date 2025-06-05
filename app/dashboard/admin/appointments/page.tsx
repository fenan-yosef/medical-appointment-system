"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Eye, Edit, Trash2, Search, XCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { format } from "date-fns" // Import date-fns for formatting

interface Appointment {
  _id: string
  patient: { _id: string; firstName: string; lastName: string; email?: string }
  doctor: { _id: string; firstName: string; lastName: string; email?: string; specialization?: string }
  department: { _id: string; name: string }
  date: string // ISO string
  time: { start: string; end: string }
  reason: string
  status: "scheduled" | "completed" | "cancelled" | "pending"
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface Department {
  _id: string
  name: string
}

interface Doctor {
  _id: string
  firstName: string
  lastName: string
}

const APPOINTMENT_STATUSES: Appointment["status"][] = ["scheduled", "completed", "cancelled", "pending"]

export default function AdminAppointmentsPage() {
  const { toast } = useToast()

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingFilters, setIsLoadingFilters] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    doctorId: "",
    patientName: "", // Simple name search for now
    departmentId: "",
    status: "",
  })

  // Sorting states
  const [sorting, setSorting] = useState({
    sortBy: "date",
    order: "desc", // asc or desc
  })

  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalAppointments: 0,
    limit: 10, // Or from a select dropdown
  })

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Appointment>>({})
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const hasFetched = useRef(false)

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // Filters
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters.dateTo) params.append("dateTo", filters.dateTo)
      if (filters.doctorId) params.append("doctorId", filters.doctorId)
      if (filters.departmentId) params.append("departmentId", filters.departmentId)
      if (filters.status) params.append("status", filters.status)

      // Sorting
      params.append("sortBy", sorting.sortBy)
      params.append("order", sorting.order)

      // Pagination
      params.append("page", pagination.currentPage.toString())
      params.append("limit", pagination.limit.toString())

      const response = await fetch(`/api/admin/appointments?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch appointments")
      }
      const data = await response.json()
      console.log("Fetched appointments:", data.appointments) // Debugging log

      setAppointments(data.appointments || [])
      setPagination((prev) => ({
        ...prev,
        totalPages: data.totalPages || 1,
        totalAppointments: data.totalAppointments || 0,
      }))
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters, sorting, pagination.currentPage, pagination.limit, toast])

  useEffect(() => {
    if (!hasFetched.current) {
      fetchAppointments()
      hasFetched.current = true
    }
  }, [fetchAppointments])

  // Fetch Departments and Doctors for filter dropdowns
  const fetchFilterData = useCallback(async () => {
    setIsLoadingFilters(true)
    try {
      const [deptRes, docRes] = await Promise.all([fetch("/api/departments"), fetch("/api/doctors")])
      if (deptRes.ok) {
        const deptData = await deptRes.json()
        setDepartments(deptData.departments || [])
      } else {
        toast({ title: "Warning", description: "Could not load departments for filtering.", variant: "default" })
      }
      if (docRes.ok) {
        const docData = await docRes.json()
        setDoctors(docData.doctors || [])
      } else {
        toast({ title: "Warning", description: "Could not load doctors for filtering.", variant: "default" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load filter options.", variant: "destructive" })
    } finally {
      setIsLoadingFilters(false)
    }
  }, [toast])

  useEffect(() => {
    fetchFilterData()
  }, [fetchFilterData])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handleSelectFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handleSortChange = (columnName: string) => {
    setSorting((prev) => ({
      sortBy: columnName,
      order: prev.sortBy === columnName && prev.order === "asc" ? "desc" : "asc",
    }))
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }))
    }
  }

  const openViewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsViewModalOpen(true)
  }

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setEditFormData({
      ...appointment,
      date: appointment.date ? new Date(appointment.date).toISOString().split("T")[0] : "",
    })
    setIsEditModalOpen(true)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "time.start" || name === "time.end") {
      const timeField = name.split(".")[1]
      setEditFormData((prev) => ({
        ...prev,
        time: {
          start: timeField === "start" ? value : prev.time?.start || "",
          end: timeField === "end" ? value : prev.time?.end || "",
        },
      }))
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/appointments/${selectedAppointment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update appointment")
      }
      toast({ title: "Success", description: "Appointment updated successfully." })
      setIsEditModalOpen(false)
      fetchAppointments()
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Error updating appointment", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const openCancelConfirm = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsCancelConfirmOpen(true)
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/appointments/${selectedAppointment._id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to cancel appointment")
      }
      toast({ title: "Success", description: "Appointment cancelled successfully." })
      setIsCancelConfirmOpen(false)
      fetchAppointments()
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Error cancelling appointment", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAppointments = useMemo(() => {
    if (!filters.patientName) return appointments
    return appointments.filter(
      (app) =>
        `${app.patient?.firstName} ${app.patient?.lastName}`
          .toLowerCase()
          .includes(filters.patientName.toLowerCase()) ||
        app.patient?._id.toLowerCase().includes(filters.patientName.toLowerCase()),
    )
  }, [appointments, filters.patientName])

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Appointments</h1>

      {/* Filters Section */}
      <div className="bg-white shadow-md rounded-lg border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-medium">Filters</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input type="date" id="dateFrom" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input type="date" id="dateTo" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select
                name="departmentId"
                value={filters.departmentId}
                onValueChange={(value) => handleSelectFilterChange("departmentId", value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {filters.departmentId
                      ? departments.find((d) => d._id === filters.departmentId)?.name
                      : "All Departments"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorId">Doctor</Label>
              <Select
                name="doctorId"
                value={filters.doctorId}
                onValueChange={(value) => handleSelectFilterChange("doctorId", value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {filters.doctorId
                      ? (() => {
                        const doc = doctors.find((d) => d._id === filters.doctorId)
                        return doc ? `${doc?.firstName} ${doc?.lastName}` : "All Doctors"
                      })()
                      : "All Doctors"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Doctors</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc?._id} value={doc?._id}>
                      {doc?.firstName} {doc?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient (Name/ID)</Label>
              <Input
                type="text"
                id="patientName"
                name="patientName"
                value={filters.patientName}
                onChange={handleFilterChange}
                placeholder="Search Patient"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                value={filters.status}
                onValueChange={(value) => handleSelectFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {filters.status
                      ? APPOINTMENT_STATUSES.find((s) => s === filters.status)
                        ?.charAt(0)
                        .toUpperCase() + filters.status.slice(1)
                      : "All Statuses"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {APPOINTMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => fetchAppointments()} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {isLoading && <p className="text-center text-gray-600 py-4">Loading appointments...</p>}
      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      {/* Table Section */}
      {!isLoading && !error && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                {/* Add onClick for sorting */}
                <TableHead
                  onClick={() => handleSortChange("patient.firstName")}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Patient
                </TableHead>
                <TableHead
                  onClick={() => handleSortChange("doctor.firstName")}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Doctor
                </TableHead>
                <TableHead
                  onClick={() => handleSortChange("department.name")}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Department
                </TableHead>
                <TableHead
                  onClick={() => handleSortChange("date")}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </TableHead>
                <TableHead
                  onClick={() => handleSortChange("status")}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <TableRow key={app._id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      {app.patient?.firstName} {app.patient?.lastName}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      {app.doctor.firstName} {app.doctor.lastName}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      {app.department.name}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      {format(new Date(app.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      {app.time.start} - {app.time.end}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${app.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : app.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : app.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700" // pending
                          }`}
                      >
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openViewModal(app)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(app)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {app.status !== "cancelled" && (
                        <Button variant="ghost" size="icon" onClick={() => openCancelConfirm(app)} title="Cancel">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                    No appointments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Section */}
      {!isLoading && !error && appointments.length > 0 && (
        <div className="bg-white shadow-md rounded-lg border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              Showing {Math.min(1 + (pagination.currentPage - 1) * pagination.limit, pagination.totalAppointments)} to{" "}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalAppointments)} of{" "}
              {pagination.totalAppointments} appointments
            </div>
            <div className="flex items-center gap-4 order-1 sm:order-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm px-3 py-2 bg-gray-50 rounded-md">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  size="sm"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) =>
                    setPagination((p) => ({ ...p, limit: Number.parseInt(value), currentPage: 1 }))
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue>{pagination.limit}/page</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10/page</SelectItem>
                    <SelectItem value="20">20/page</SelectItem>
                    <SelectItem value="50">50/page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Patient</h3>
                  <p className="font-medium">
                    {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedAppointment.patient?.email}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Doctor</h3>
                  <p className="font-medium">
                    {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedAppointment.doctor.specialization}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p>{selectedAppointment.department.name}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                  <p>{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                  <p className="text-sm">
                    {selectedAppointment.time.start} - {selectedAppointment.time.end}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedAppointment.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : selectedAppointment.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : selectedAppointment.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700" // pending
                      }`}
                  >
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p>
                    {selectedAppointment.createdAt ? new Date(selectedAppointment.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Reason</h3>
                <p className="text-sm">{selectedAppointment.reason}</p>
              </div>
              {selectedAppointment.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Modify the appointment details below.</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  type="date"
                  id="edit-date"
                  name="date"
                  value={editFormData.date ? new Date(editFormData.date).toISOString().split("T")[0] : ""}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-time-start">Start Time</Label>
                  <Input
                    type="time"
                    id="edit-time-start"
                    name="time.start"
                    value={editFormData.time?.start || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time-end">End Time</Label>
                  <Input
                    type="time"
                    id="edit-time-end"
                    name="time.end"
                    value={editFormData.time?.end || ""}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-departmentId">Department</Label>
                <Select
                  name="department"
                  value={
                    typeof editFormData.department === "string"
                      ? editFormData.department
                      : editFormData.department?._id || ""
                  }
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      department: departments.find((d) => d._id === value) || { _id: value, name: "" },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(() => {
                        const val =
                          typeof editFormData.department === "string"
                            ? editFormData.department
                            : editFormData.department?._id
                        return val
                          ? departments.find((d) => d._id === val)?.name || "Select Department"
                          : "Select Department"
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id || ""}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doctorId">Doctor</Label>
                <Select
                  name="doctor"
                  value={typeof editFormData.doctor === "string" ? editFormData.doctor : editFormData.doctor?._id || ""}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      doctor: doctors.find((d) => d._id === value) || { _id: value, firstName: "", lastName: "" },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(() => {
                        const val =
                          typeof editFormData.doctor === "string" ? editFormData.doctor : editFormData.doctor?._id
                        return val
                          ? (() => {
                            const doc = doctors.find((d) => d._id === val)
                            return doc ? `${doc?.firstName} ${doc?.lastName}` : "Select Doctor"
                          })()
                          : "Select Doctor"
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doc) => (
                      <SelectItem key={doc?._id} value={doc?._id || ""}>
                        {doc?.firstName} {doc?.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  name="status"
                  value={editFormData.status || ""}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, status: value as Appointment["status"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {editFormData.status
                        ? APPOINTMENT_STATUSES.find((s) => s === editFormData.status)
                          ?.charAt(0)
                          .toUpperCase() + (editFormData.status as string).slice(1)
                        : "Select Status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reason">Reason</Label>
                <Input
                  id="edit-reason"
                  name="reason"
                  value={editFormData.reason || ""}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={editFormData.notes || ""}
                  onChange={handleEditFormChange}
                  placeholder="Record any reasons for manual changes, rescheduling, or overrides here."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Important: Use this field to document any manual changes or reasons for overriding existing
                  appointment details.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action will set the status to 'Cancelled'.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="py-4 space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">
                  {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time.start}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">No, keep it</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleCancelAppointment} disabled={isLoading}>
              {isLoading ? "Cancelling..." : "Yes, cancel appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
