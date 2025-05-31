"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Doctor {
  _id: string; // MongoDB ObjectId
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string; // Corrected from `phone`
  specialization: string; // Corrected from `specialty`
  schedule?: string; // Optional
  isActive: boolean;
  licenseNumber?: string; // Optional
  experience?: number; // Optional
  department?: {
    _id: string; // Department ObjectId
    name: string; // Department name
  };
}

interface DoctorsResponse {
  doctors: Doctor[]
  totalDoctors: number
  page: number
  totalPages: number
}

// Custom Dialog Components
const Dialog = ({ open, children }: { open: boolean; children: React.ReactNode }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">{children}</div>
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

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-sm text-gray-600 mt-1">{children}</p>
}

const DialogFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex justify-end space-x-2 mt-6">{children}</div>
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("lastName")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDoctors, setTotalDoctors] = useState(0)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});
  const [specialties, setSpecialties] = useState<string[]>([])
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    schedule: "",
    isActive: true,
  })
  const { toast } = useToast()

  const limit = 10


  const fetchSpecialties = async () => {
    try {
      const response = await fetch("/api/departments");
      const data = await response.json();

      if (response.ok) {
        // Extract specialties from the departments
        const fetchedSpecialties = data.departments.map((department: { name: string }) => department.name);
        setSpecialties(fetchedSpecialties);

        const map = data.departments.reduce((acc: Record<string, string>, department: { _id: string; name: string }) => {
          acc[department.name] = department._id;
          return acc;
        }, {});
        setDepartmentMap(map);
      } else {
        throw new Error(data.message || "Failed to fetch specialties");
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true)
    try {

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        order: sortOrder,
      })
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      if (specialtyFilter && specialtyFilter !== "all") {
        params.append("specialization", specialtyFilter)
      }

      const response = await fetch(`/api/admin/doctors?${params}`)
      const data: DoctorsResponse = await response.json()

      setDoctors(data.doctors);
      setTotalPages(data.totalPages);
      setTotalDoctors(data.totalDoctors);

      console.log("Fetched doctors:", data)

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

  useEffect(() => {
    fetchDoctors()
  }, [currentPage, sortBy, sortOrder, searchTerm, specialtyFilter])

  // Update doctor
  const updateDoctor = async () => {
    if (!selectedDoctor) return

    try {
      setDoctors((prev) => prev.map((d) => (d._id === selectedDoctor._id ? { ...d, ...editFormData } : d)))

      toast({
        title: "Success",
        description: "Doctor updated successfully",
      })
      setEditDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update doctor",
        variant: "destructive",
      })
    }
  }

  // Add new doctor
  const addDoctor = async () => {
    try {

      if (!editFormData.firstName || !editFormData.lastName || !editFormData.email || !editFormData.specialization) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const departmentId = departmentMap[editFormData.specialization];
      if (!departmentId) {
        toast({
          title: "Error",
          description: "Invalid specialization. Please select a valid department.",
          variant: "destructive",
        });
        return;
      }


      // Prepare data with correct field names for backend
      const doctorData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        password: editFormData.password,
        specialization: editFormData.specialization, // Send department ID
        department: departmentId,
        phoneNumber: editFormData.phone, // Map to phoneNumber
        schedule: editFormData.schedule,
        isActive: editFormData.isActive,
      }

      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doctorData), // Send form data to the backend
      });

      const data = await response.json();

      if (!response.ok) {
        // throw new Error(data.message || "Failed to add doctor");
        console.log("Error adding doctor:", data.message || "Failed to add doctor");
      }

      toast({
        title: "Success",
        description: "Doctor added successfully",
      })
      setAddDialogOpen(false)
      resetForm()
      fetchDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add doctor",
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

  const openEditDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setEditFormData({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      password: "",
      phone: doctor.phoneNumber,
      specialization: doctor.specialization,
      schedule: doctor.schedule || "Mon-Fri, 9am-5pm",
      isActive: doctor.isActive,
    })
    setEditDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setAddDialogOpen(true)
  }

  const resetForm = () => {
    setEditFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      specialization: "",
      schedule: "Mon-Fri, 9am-5pm",
      isActive: true,
    })
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setSelectedDoctor(null)
  }

  const closeAddDialog = () => {
    setAddDialogOpen(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Doctor Management</h2>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search doctors by name or specialty"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-300 text-base"
            />
          </div>

          <Select
            value={specialtyFilter}
            onValueChange={setSpecialtyFilter}
            className="w-[180px] h-12 bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-300 text-base"
          >
            <SelectContent className="]">
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map((specialization) => (
                <SelectItem key={specialization} value={specialization}>
                  {specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchDoctors} className="h-12 w-12 p-0 border-gray-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Doctor List Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="px-6 py-5 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-900">Doctor List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead
                      className="h-14 px-6 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => handleSort("lastName")}
                    >
                      Name {sortBy === "lastName" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="h-14 px-6 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => handleSort("specialization")}
                    >
                      Specialty {sortBy === "specialization" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="h-14 px-6 text-left text-sm font-medium text-gray-700">Contact</TableHead>
                    <TableHead className="h-14 px-6 text-left text-sm font-medium text-gray-700">Schedule</TableHead>
                    <TableHead className="h-14 px-6 text-left text-sm font-medium text-gray-700">Actions</TableHead>
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
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </TableCell>
                        <TableCell className="h-16 px-6 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </TableCell>
                        <TableCell className="h-16 px-6 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </TableCell>
                        <TableCell className="h-16 px-6 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : doctors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                        No doctors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    doctors.map((doctor) => (
                      <TableRow
                        key={doctor._id} // Use `_id` as the unique key
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell className="h-16 px-6">
                          <div className="font-medium text-gray-900">
                            Dr. {doctor.firstName || "N/A"} {doctor.lastName || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <div className="text-gray-600">{doctor.specialization || "N/A"}</div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <div className="text-gray-600">{doctor.phoneNumber || "N/A"}</div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <div className="text-gray-600">{doctor.department?.name || "N/A"}</div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(doctor)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalDoctors)} of{" "}
                {totalDoctors} doctors
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50"
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
                        className={`w-8 h-8 p-0 ${currentPage === page
                          ? "bg-gray-900 hover:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                          }`}
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
                  className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Doctor Button */}
        <div className="flex justify-end">
          <Button onClick={openAddDialog} className="bg-gray-900 hover:bg-gray-800">
            Add New Doctor
          </Button>
        </div>

        {/* Edit Doctor Dialog */}
        <Dialog open={editDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Edit Doctor</DialogTitle>
                <Button variant="ghost" size="sm" onClick={closeEditDialog} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>Make changes to the doctor profile here.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1"
                  placeholder="Leave empty to keep current password"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="specialization">specialization</Label>
                <Select
                  value={editFormData.specialization}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, specialization: value }))}
                >
                  <SelectContent>
                    {specialties.map((specialization) => (
                      <SelectItem key={specialization} value={specialization}>
                        {specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="schedule">Schedule</Label>
                <Input
                  id="schedule"
                  value={editFormData.schedule}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, schedule: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={updateDoctor}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Doctor Dialog */}
        <Dialog open={addDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Add New Doctor</DialogTitle>
                <Button variant="ghost" size="sm" onClick={closeAddDialog} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>Add a new doctor to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addFirstName">First Name</Label>
                  <Input
                    id="addFirstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="addLastName">Last Name</Label>
                  <Input
                    id="addLastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="addEmail">Email</Label>
                <Input
                  id="addEmail"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1"
                  placeholder="Enter a secure password"
                />
              </div>
              <div>
                <Label htmlFor="addPhone">Phone</Label>
                <Input
                  id="addPhone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1"
                  placeholder="+251 911 234 567"
                />
              </div>
              <div>
                <Label htmlFor="addSpecialty">Specialty</Label>
                <Select
                  value={editFormData.specialization}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, specialization: value }))}
                >
                  <SelectContent>
                    {specialties.map((specialization) => (
                      <SelectItem key={specialization} value={specialization}>
                        {specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="addSchedule">Schedule</Label>
                <Input
                  id="addSchedule"
                  value={editFormData.schedule}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, schedule: e.target.value }))}
                  className="mt-1"
                  placeholder="Mon-Fri, 9am-5pm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddDialog}>
                Cancel
              </Button>
              <Button onClick={addDoctor}>Add Doctor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
