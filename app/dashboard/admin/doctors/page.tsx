"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Edit, Search, UserX, UserCheck, UserPlus } from "lucide-react"; // Added UserPlus
import Link from "next/link"; // Added Link

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: Address;
  dateOfBirth?: string; // ISO string
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  profileImage?: string;
  specialization?: string;
  licenseNumber?: string;
  department?: { _id: string; name: string };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Department {
  _id: string;
  name: string;
}

const GENDERS: DoctorProfile["gender"][] = ["male", "female", "other", "prefer_not_to_say"];


export default function AdminDoctorsPage() {
  const { toast } = useToast();

  // Data states
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    specialization: "",
    departmentId: "",
    isActive: "", // "true", "false", or ""
  });

  // Sorting states
  const [sorting, setSorting] = useState({
    sortBy: "lastName",
    order: "asc",
  });

  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDoctors: 0,
    limit: 10,
  });

  // Modal states
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<DoctorProfile>>({});


  const fetchDoctorsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append("name", filters.name);
      if (filters.specialization) params.append("specialization", filters.specialization);
      if (filters.departmentId) params.append("departmentId", filters.departmentId);
      if (filters.isActive !== "") params.append("isActive", filters.isActive);
      
      params.append("sortBy", sorting.sortBy);
      params.append("order", sorting.order);
      params.append("page", pagination.currentPage.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/doctors?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch doctors list");
      }
      const data = await response.json();
      setDoctorsList(data.doctors || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1,
        totalDoctors: data.totalDoctors || 0,
      }));
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [filters, sorting, pagination.currentPage, pagination.limit, toast]);

  useEffect(() => {
    fetchDoctorsList();
  }, [fetchDoctorsList]);

  // Fetch Departments for filter/edit modal dropdowns
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await fetch("/api/departments");
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        } else {
          toast({ title: "Warning", description: "Could not load departments for filtering/editing.", variant: "default" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load departments.", variant: "destructive"});
      }
    };
    fetchDepts();
  }, [toast]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const handleSelectFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSortChange = (columnName: string) => {
    setSorting(prev => ({
      sortBy: columnName,
      order: prev.sortBy === columnName && prev.order === "asc" ? "desc" : "asc",
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };
  
  const openEditModal = async (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setIsLoadingModalData(true);
    try {
        const response = await fetch(`/api/admin/doctors/${doctor._id}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch doctor details.");
        }
        const data = await response.json();
        setEditFormData({
            ...data.doctor,
            dateOfBirth: data.doctor.dateOfBirth ? new Date(data.doctor.dateOfBirth).toISOString().split('T')[0] : "",
            department: data.doctor.department?._id, // Store only ID for select
        });
        setIsEditModalOpen(true);
    } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
        setIsLoadingModalData(false);
    }
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = e.target.checked; // For checkboxes/toggles if used

    if (name.startsWith("address.")) {
        const field = name.split('.')[1];
        setEditFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else if (type === "checkbox" && name === "isActive") {
        setEditFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSelectChange = (name: string, value: string | boolean) => {
    setEditFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setIsLoading(true); // Use a general loading for form submission
    try {
        const { _id, createdAt, updatedAt, ...payload } = editFormData; // Exclude non-updatable fields

        // Ensure department is just an ID string if it's an object
        if (payload.department && typeof payload.department === 'object') {
            // @ts-ignore
            payload.department = payload.department._id;
        }
        
        const response = await fetch(`/api/admin/doctors/${selectedDoctor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update doctor profile.");
        }
        toast({ title: "Success", description: "Doctor profile updated successfully." });
        setIsEditModalOpen(false);
        fetchDoctorsList(); // Refresh list
    } catch (err: any) {
        setError(err.message); // Can show this error in modal or as toast
        toast({ title: "Error updating profile", description: err.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Doctor Profiles</h1>
        <Link href="/dashboard/admin/doctors/add" passHref>
          <Button>
            <UserPlus className="mr-2 h-5 w-5" /> Add New Doctor
          </Button>
        </Link>
      </div>

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
          <Input name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search by Name..." />
          <Input name="specialization" value={filters.specialization} onChange={handleFilterChange} placeholder="Search by Specialization..." />
          <Select name="departmentId" value={filters.departmentId} onValueChange={(value) => handleSelectFilterChange("departmentId", value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map(dept => <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select name="isActive" value={filters.isActive} onValueChange={(value) => handleSelectFilterChange("isActive", value)}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchDoctorsList()} className="w-full md:w-auto">
            <Search className="mr-2 h-4 w-4"/> Apply
          </Button>
        </div>
      </div>
      
      {isLoading && !isEditModalOpen && <p className="text-center text-gray-600 py-4">Loading doctors...</p>}
      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      {/* Table Section */}
      {!isLoading && !error && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSortChange('lastName')} className="cursor-pointer">Name</TableHead>
                <TableHead onClick={() => handleSortChange('email')} className="cursor-pointer">Email</TableHead>
                <TableHead onClick={() => handleSortChange('specialization')} className="cursor-pointer">Specialization</TableHead>
                <TableHead onClick={() => handleSortChange('department.name')} className="cursor-pointer">Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead onClick={() => handleSortChange('isActive')} className="cursor-pointer">Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorsList.length > 0 ? (
                doctorsList.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>{doc.firstName} {doc.lastName}</TableCell>
                    <TableCell>{doc.email}</TableCell>
                    <TableCell>{doc.specialization || "N/A"}</TableCell>
                    <TableCell>{doc.department?.name || "N/A"}</TableCell>
                    <TableCell>{doc.phoneNumber || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {doc.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(doc)} disabled={isLoadingModalData}>
                        <Edit className="mr-1 h-4 w-4" /> {isLoadingModalData && selectedDoctor?._id === doc._id ? "Loading..." : "Edit Profile"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-6">No doctors found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Section */}
      {!isLoading && !error && doctorsList.length > 0 && (
         <div className="mt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600">
                Showing {Math.min(1 + (pagination.currentPage - 1) * pagination.limit, pagination.totalDoctors)} 
                to {Math.min(pagination.currentPage * pagination.limit, pagination.totalDoctors)} of {pagination.totalDoctors} doctors
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} size="sm">
                <ChevronLeft className="h-4 w-4 mr-1 md:mr-2"/> Previous
                </Button>
                <span className="text-sm p-2">Page {pagination.currentPage} of {pagination.totalPages}</span>
                <Button variant="outline" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} size="sm">
                Next <ChevronRight className="h-4 w-4 ml-1 md:ml-2"/>
                </Button>
            </div>
            <Select value={pagination.limit.toString()} onValueChange={(value) => setPagination(p => ({...p, limit: parseInt(value), currentPage: 1}))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10/page</SelectItem>
                    <SelectItem value="20">20/page</SelectItem>
                    <SelectItem value="50">50/page</SelectItem>
                </SelectContent>
            </Select>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl"> {/* Wider modal for more fields */}
          <DialogHeader>
            <DialogTitle>Edit Doctor Profile: {selectedDoctor?.firstName} {selectedDoctor?.lastName}</DialogTitle>
            <DialogDescription>Modify the doctor's details below. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {isLoadingModalData && <p className="text-center py-4">Loading doctor details...</p>}
          {!isLoadingModalData && selectedDoctor && (
            <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" value={editFormData.firstName || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" value={editFormData.lastName || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={editFormData.email || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="phoneNumber">Phone Number</Label><Input id="phoneNumber" name="phoneNumber" value={editFormData.phoneNumber || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" name="dateOfBirth" type="date" value={editFormData.dateOfBirth || ""} onChange={handleEditFormChange} /></div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" value={editFormData.gender || ""} onValueChange={(value) => handleEditSelectChange("gender", value)}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Label>Address</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-md">
                <div><Label htmlFor="address.street" className="text-xs">Street</Label><Input id="address.street" name="address.street" value={editFormData.address?.street || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="address.city" className="text-xs">City</Label><Input id="address.city" name="address.city" value={editFormData.address?.city || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="address.state" className="text-xs">State</Label><Input id="address.state" name="address.state" value={editFormData.address?.state || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="address.zipCode" className="text-xs">Zip Code</Label><Input id="address.zipCode" name="address.zipCode" value={editFormData.address?.zipCode || ""} onChange={handleEditFormChange} /></div>
                <div className="md:col-span-2"><Label htmlFor="address.country" className="text-xs">Country</Label><Input id="address.country" name="address.country" value={editFormData.address?.country || ""} onChange={handleEditFormChange} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="specialization">Specialization</Label><Input id="specialization" name="specialization" value={editFormData.specialization || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="licenseNumber">License Number</Label><Input id="licenseNumber" name="licenseNumber" value={editFormData.licenseNumber || ""} onChange={handleEditFormChange} /></div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" value={editFormData.department || ""} onValueChange={(value) => handleEditSelectChange("department", value)}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (No Department)</SelectItem>
                      {departments.map(dept => <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select name="isActive" value={editFormData.isActive ? "true" : "false"} onValueChange={(value) => handleEditSelectChange("isActive", value === "true")}>
                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div><Label htmlFor="profileImage">Profile Image URL</Label><Input id="profileImage" name="profileImage" value={editFormData.profileImage || ""} onChange={handleEditFormChange} placeholder="Enter URL for profile image"/></div>
              </div>
              
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
