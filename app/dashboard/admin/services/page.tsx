"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Service {
  _id: string
  name: string
  description?: string
  department?: {
    _id: string
    name: string
  }
  cost?: number
  duration?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Department {
  _id: string
  name: string
  description?: string
  isActive: boolean
}

interface ServicesResponse {
  success: boolean
  data: Service[]
  totalPages: number
  currentPage: number
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false) // New state for unauthorized status
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    department: "",
    cost: "",
    duration: "",
    isActive: true,
  })
  const { toast } = useToast()

  const limit = 10

  // Fetch services
  const fetchServices = async () => {
    setLoading(true)
    setUnauthorized(false) // Reset unauthorized state before fetching
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sort: sortBy,
        sortOrder: sortOrder,
      })

      if (searchTerm) {
        params.append("name", searchTerm)
      }

      if (departmentFilter && departmentFilter !== "all") {
        params.append("department", departmentFilter)
      }

      const response = await fetch(`/api/admin/services?${params}`)

      if (response.status === 403) {
        setUnauthorized(true) // Set unauthorized state if 403 is returned
        return
      }

      const data: ServicesResponse = await response.json()

      if (data.success) {
        setServices(data.data)
        setTotalPages(data.totalPages)
      } else {
        throw new Error("Failed to fetch services")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [currentPage, sortBy, sortOrder, searchTerm, departmentFilter])

  // Add new service
  const addService = async () => {
    try {
      if (!editFormData.name) {
        toast({
          title: "Error",
          description: "Service name is required",
          variant: "destructive",
        })
        return
      }

      const serviceData = {
        name: editFormData.name,
        description: editFormData.description,
        department: editFormData.department || undefined,
        cost: editFormData.cost ? Number.parseFloat(editFormData.cost) : undefined,
        duration: editFormData.duration ? Number.parseInt(editFormData.duration) : undefined,
        isActive: editFormData.isActive,
      }

      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add service")
      }

      toast({
        title: "Success",
        description: "Service added successfully",
      })
      setAddDialogOpen(false)
      resetForm()
      fetchServices()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add service",
        variant: "destructive",
      })
    }
  }

  // Update service
  const updateService = async () => {
    if (!selectedService) return

    try {
      // For now, just update locally since PUT endpoint wasn't provided
      setServices((prev) =>
        prev.map((s) =>
          s._id === selectedService._id
            ? {
              ...s,
              name: editFormData.name,
              description: editFormData.description,
              cost: editFormData.cost ? Number.parseFloat(editFormData.cost) : undefined,
              duration: editFormData.duration ? Number.parseInt(editFormData.duration) : undefined,
              isActive: editFormData.isActive,
            }
            : s,
        ),
      )

      toast({
        title: "Success",
        description: "Service updated successfully",
      })
      setEditDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
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

  const openEditDialog = (service: Service) => {
    setSelectedService(service)
    setEditFormData({
      name: service.name,
      description: service.description || "",
      department: service.department?._id || "",
      cost: service.cost?.toString() || "",
      duration: service.duration?.toString() || "",
      isActive: service.isActive,
    })
    setEditDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setAddDialogOpen(true)
  }

  const resetForm = () => {
    setEditFormData({
      name: "",
      description: "",
      department: "",
      cost: "",
      duration: "",
      isActive: true,
    })
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setSelectedService(null)
  }

  const closeAddDialog = () => {
    setAddDialogOpen(false)
    resetForm()
  }

  const formatPrice = (cost?: number) => {
    if (!cost) return "N/A"
    return `${cost} ETB`
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex-1 space-y-8 p-8 pt-6">
        {/* Unauthorized Message */}
        {unauthorized && (
          <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded">
            You are not authorized to view this page.
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Manage Services</h2>
          </div>
          <div>
            <Button onClick={openAddDialog} className="bg-gray-900 hover:bg-gray-800">
              Add Service
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search services"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-300 text-base"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px] h-12 bg-white border-gray-200 focus:border-gray-300 focus:ring-gray-300">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department._id} value={department._id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchServices} className="h-12 w-12 p-0 border-gray-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Services Table */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead
                      className="h-14 px-6 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      Service Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="h-14 px-6 text-left text-sm font-medium text-gray-700">Category</TableHead>
                    <TableHead className="h-14 px-6 text-left text-sm font-medium text-gray-700">Description</TableHead>
                    <TableHead
                      className="h-14 px-6 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => handleSort("cost")}
                    >
                      Price {sortBy === "cost" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
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
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </TableCell>
                        <TableCell className="h-16 px-6 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </TableCell>
                        <TableCell className="h-16 px-6 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                        No services found
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((service) => (
                      <TableRow
                        key={service._id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell className="h-16 px-6">
                          <div className="font-medium text-gray-900">{service.name}</div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <div className="text-gray-600">{service.department?.name || "N/A"}</div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <div className="text-gray-600 max-w-xs truncate">
                            {service.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <div className="text-gray-900 font-medium">{formatPrice(service.cost)}</div>
                        </TableCell>
                        <TableCell className="h-16 px-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(service)}
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
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, services.length)} of{" "}
                {services.length} services
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

        {/* Edit Service Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Edit Service</DialogTitle>
                <Button variant="ghost" size="sm" onClick={closeEditDialog} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>Make changes to the service here.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department">Category</Label>
                <Select
                  value={editFormData.department}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost (ETB)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={editFormData.cost}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, cost: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={updateService}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Service Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Add New Service</DialogTitle>
                <Button variant="ghost" size="sm" onClick={closeAddDialog} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>Add a new service to the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="addServiceName">Service Name *</Label>
                <Input
                  id="addServiceName"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="addDescription">Description</Label>
                <Input
                  id="addDescription"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="addDepartment">Category</Label>
                <Select
                  value={editFormData.department}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addCost">Cost (ETB)</Label>
                  <Input
                    id="addCost"
                    type="number"
                    value={editFormData.cost}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, cost: e.target.value }))}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="addDuration">Duration (minutes)</Label>
                  <Input
                    id="addDuration"
                    type="number"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    className="mt-1"
                    placeholder="30"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddDialog}>
                Cancel
              </Button>
              <Button onClick={addService}>Add Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
