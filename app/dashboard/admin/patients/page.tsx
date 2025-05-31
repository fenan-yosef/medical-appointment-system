"use client"

import { useState, useEffect } from "react"
import { Search, MoreHorizontal, UserPlus, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  age: number
  gender: string
  lastVisit: string
  isActive: boolean
  phone?: string
  address?: string
}

interface PatientsResponse {
  patients: Patient[]
  total: number
  page: number
  totalPages: number
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("lastName")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPatients, setTotalPatients] = useState(0)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    isActive: true,
  })
  const { toast } = useToast()

  const limit = 10

  // Mock data for development
  const mockPatients: Patient[] = [
    {
      id: "1",
      firstName: "Abebe",
      lastName: "Kebede",
      email: "abebe.kebede@email.com",
      age: 45,
      gender: "male",
      lastVisit: "2023-11-15",
      isActive: true,
    },
    {
      id: "2",
      firstName: "Tigist",
      lastName: "Alemayehu",
      email: "tigist.alemayehu@email.com",
      age: 32,
      gender: "female",
      lastVisit: "2023-12-02",
      isActive: false,
    },
    {
      id: "3",
      firstName: "Tesfaye",
      lastName: "Mekonnen",
      email: "tesfaye.mekonnen@email.com",
      age: 60,
      gender: "male",
      lastVisit: "2023-10-20",
      isActive: true,
    },
    {
      id: "4",
      firstName: "Mulugeta",
      lastName: "Haile",
      email: "mulugeta.haile@email.com",
      age: 50,
      gender: "male",
      lastVisit: "2023-11-28",
      isActive: true,
    },
    {
      id: "5",
      firstName: "Aster",
      lastName: "Mengistu",
      email: "aster.mengistu@email.com",
      age: 28,
      gender: "female",
      lastVisit: "2023-12-10",
      isActive: true,
    },
  ]

  // Fetch patients data
  const fetchPatients = async () => {
    setLoading(true)
    try {
      // For now, use mock data. Replace with actual API call
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        order: sortOrder,
      })

      if (searchTerm) {
        params.append("name", searchTerm)
      }
      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false")
      }

      const response = await fetch(`/api/admin/patients?${params}`)
      const data: PatientsResponse = await response.json()
      console.log("Fetched patients data:", data)

      if (!response.ok) {
        console.log("Error fetching patients:", data)
      }

      setPatients(data.patients)
      setTotalPages(data.totalPages)
      setTotalPatients(data.total)

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [currentPage, sortBy, sortOrder, searchTerm, statusFilter, genderFilter])

  // Toggle patient status
  const togglePatientStatus = async (patientId: string, currentStatus: boolean) => {
    try {
      // const response = await fetch(`/api/admin/patients/${patientId}/status`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ isActive: !currentStatus }),
      // })

      // if (response.ok) {
      // Update mock data
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, isActive: !currentStatus } : p)))

      toast({
        title: "Success",
        description: `Patient ${!currentStatus ? "activated" : "deactivated"} successfully`,
      })
      // } else {
      //   throw new Error("Failed to update status")
      // }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      })
    }
  }

  // Reset patient password
  const resetPatientPassword = async (patientId: string) => {
    try {
      // const response = await fetch(`/api/admin/patients/${patientId}/reset-password`, {
      //   method: "POST",
      // })

      // if (response.ok) {
      //   const data = await response.json()
      toast({
        title: "Password Reset",
        description: "Password reset link has been generated",
      })
      setResetPasswordDialogOpen(false)
      // } else {
      //   throw new Error("Failed to reset password")
      // }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset patient password",
        variant: "destructive",
      })
    }
  }

  // Update patient
  const updatePatient = async () => {
    if (!selectedPatient) return

    try {
      // const response = await fetch(`/api/admin/patients/${selectedPatient.id}`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(editFormData),
      // })

      // if (response.ok) {
      // Update mock data
      setPatients((prev) => prev.map((p) => (p.id === selectedPatient.id ? { ...p, ...editFormData } : p)))

      toast({
        title: "Success",
        description: "Patient updated successfully",
      })
      setEditDialogOpen(false)
      // } else {
      //   throw new Error("Failed to update patient")
      // }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      })
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient)
    setEditFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      isActive: patient.isActive,
    })
    setEditDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter} className="w-[140px]">
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={setGenderFilter} className="w-[140px]">
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={fetchPatients}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border ">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead
                    className="h-12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleSort("lastName")}
                  >
                    Name {sortBy === "lastName" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="h-12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleSort("age")}
                  >
                    Age {sortBy === "age" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="h-12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </TableHead>
                  <TableHead
                    className="h-12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleSort("email")}
                  >
                    Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="h-12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleSort("lastVisit")}
                  >
                    Last Visit {sortBy === "lastVisit" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="h-12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="h-12 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="border-b border-gray-50">
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </TableCell>
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </TableCell>
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </TableCell>
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                      </TableCell>
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </TableCell>
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </TableCell>
                      <TableCell className="h-16 px-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.slice((currentPage - 1) * limit, currentPage * limit).map((patient, index) => (
                    <TableRow
                      key={patient.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="h-16 px-6">
                        <div className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="h-16 px-6">
                        <div className="text-gray-900">{patient.age}</div>
                      </TableCell>
                      <TableCell className="h-16 px-6">
                        <div className="text-gray-600 capitalize">{patient.gender}</div>
                      </TableCell>
                      <TableCell className="h-16 px-6">
                        <div className="text-gray-900">{patient.email}</div>
                      </TableCell>
                      <TableCell className="h-16 px-6">
                        <div className="text-gray-600">{new Date(patient.lastVisit).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell className="h-16 px-6">
                        <Badge
                          variant={patient.isActive ? "default" : "secondary"}
                          className={`${patient.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                            } font-medium px-3 py-1`}
                        >
                          {patient.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="h-16 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(patient)}>Edit Patient</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPatient(patient)
                                setResetPasswordDialogOpen(true)
                              }}
                            >
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => togglePatientStatus(patient.id, patient.isActive)}>
                              {patient.isActive ? "Deactivate" : "Activate"} Patient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalPatients)} of{" "}
              {totalPatients} patients
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Patient Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Make changes to the patient profile here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <Switch
                id="active"
                checked={editFormData.isActive}
                onCheckedChange={(checked) => setEditFormData((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={updatePatient}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the password for {selectedPatient?.firstName} {selectedPatient?.lastName}?
              A reset link will be generated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedPatient && resetPatientPassword(selectedPatient.id)}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
