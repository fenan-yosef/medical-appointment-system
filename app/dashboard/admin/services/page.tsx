'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, Search, RotateCw } from 'lucide-react';
import { IService } from '@/models/Service'; // Assuming IService is exported from the model
import { IDepartment } from '@/models/Department'; // Assuming IDepartment is exported

const initialServiceFormState = {
  _id: '',
  name: '',
  description: '',
  department: '',
  cost: 0,
  duration: '',
  isActive: true,
};

interface DepartmentOption {
  _id: string;
  name: string;
}

const AdminServicesPage = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<IService[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [serviceFormData, setServiceFormData] = useState(initialServiceFormState);

  const fetchDepartments = useCallback(async () => {
    try {
      // Assuming an API endpoint to fetch all departments exists
      // This is similar to how it's done in doctors/page.tsx
      const response = await fetch('/api/admin/departments?limit=0'); // limit=0 to get all
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data.data || []);
    } catch (err: any) {
      toast({
        title: 'Error fetching departments',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sort: sortField,
        sortOrder: sortOrder,
        ...(searchTerm && { name: searchTerm }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterStatus && { isActive: filterStatus }),
      });
      const response = await fetch(`/api/admin/services?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch services');
      }
      const data = await response.json();
      setServices(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching services',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortField, sortOrder, searchTerm, filterDepartment, filterStatus, toast]);

  useEffect(() => {
    fetchDepartments();
    fetchServices();
  }, [fetchServices, fetchDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setServiceFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    setServiceFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrUpdateService = async () => {
    if (!serviceFormData.name) {
      toast({ title: 'Validation Error', description: 'Service name is required.', variant: 'destructive' });
      return;
    }

    const method = selectedService ? 'PUT' : 'POST';
    const url = selectedService ? `/api/admin/services/${selectedService._id}` : '/api/admin/services';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...serviceFormData,
            cost: Number(serviceFormData.cost) || undefined, // Ensure cost is a number or undefined
            department: serviceFormData.department || undefined, // Ensure department is ObjectId string or undefined
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${selectedService ? 'update' : 'create'} service`);
      }
      toast({
        title: `Service ${selectedService ? 'Updated' : 'Created'}`,
        description: `Service "${result.data.name}" has been successfully ${selectedService ? 'updated' : 'created'}.`,
      });
      setIsModalOpen(false);
      fetchServices(); // Refresh list
    } catch (err: any) {
      toast({
        title: `Error ${selectedService ? 'updating' : 'creating'} service`,
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const openModalToCreate = () => {
    setSelectedService(null);
    setServiceFormData(initialServiceFormState);
    setIsModalOpen(true);
  };

  const openModalToEdit = (service: IService) => {
    setSelectedService(service);
    setServiceFormData({
      _id: service._id,
      name: service.name,
      description: service.description || '',
      department: (service.department as IDepartment)?._id || '', // Handle populated department
      cost: service.cost || 0,
      duration: service.duration || '',
      isActive: service.isActive,
    });
    setIsModalOpen(true);
  };
  
  const openDeleteConfirm = (service: IService) => {
    setSelectedService(service);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    try {
      const response = await fetch(`/api/admin/services/${selectedService._id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }
      toast({
        title: 'Service Deleted',
        description: `Service "${selectedService.name}" has been successfully deleted.`,
      });
      setIsDeleteConfirmOpen(false);
      setSelectedService(null);
      fetchServices(); // Refresh list
      if (services.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      toast({
        title: 'Error deleting service',
        description: err.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleRetry = () => {
    fetchServices();
    fetchDepartments();
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };
  
  // Helper to get department name
  const getDepartmentName = (department: string | IDepartment | undefined): string => {
    if (!department) return 'N/A';
    if (typeof department === 'string') {
        const dept = departments.find(d => d._id === department);
        return dept ? dept.name : 'N/A';
    }
    return department.name || 'N/A';
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Services</h1>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
            className="max-w-xs"
          />
          <Select value={filterDepartment} onValueChange={(value) => { setFilterDepartment(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openModalToCreate} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded flex justify-between items-center">
          <span>Error: {error}. Please try again.</span>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RotateCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      {/* Services Table */}
      {isLoading && !error ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading services...</p>
        </div>
      ) : !isLoading && !error && services.length === 0 ? (
         <div className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterDepartment || filterStatus ? "Try adjusting your search or filter criteria." : "Get started by creating a new service."}
            </p>
            {(searchTerm || filterDepartment || filterStatus) && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearchTerm(''); setFilterDepartment(''); setFilterStatus(''); setCurrentPage(1); }}>
                    Clear Filters
                </Button>
            )}
          </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead onClick={() => handleSort('department.name')} className="cursor-pointer">
                Department {sortField === 'department.name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </TableHead>
              <TableHead onClick={() => handleSort('cost')} className="cursor-pointer">
                Cost {sortField === 'cost' && (sortOrder === 'asc' ? '▲' : '▼')}
              </TableHead>
              <TableHead>Duration</TableHead>
              <TableHead onClick={() => handleSort('isActive')} className="cursor-pointer">
                Status {sortField === 'isActive' && (sortOrder === 'asc' ? '▲' : '▼')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service._id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.description?.substring(0,50)}{service.description && service.description.length > 50 ? '...' : ''}</TableCell>
                <TableCell>{getDepartmentName(service.department)}</TableCell>
                <TableCell>{service.cost != null ? `$${service.cost.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell>{service.duration || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openModalToEdit(service)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteConfirm(service)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      {renderPagination()}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{selectedService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" value={serviceFormData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input id="description" name="description" value={serviceFormData.description} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department</Label>
              <Select 
                name="department" 
                value={serviceFormData.department} 
                onValueChange={(value) => handleSelectChange('department', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=""><em>None</em></SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">Cost ($)</Label>
              <Input id="cost" name="cost" type="number" value={serviceFormData.cost} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">Duration</Label>
              <Input id="duration" name="duration" value={serviceFormData.duration} onChange={handleInputChange} className="col-span-3" placeholder="e.g., 30 minutes, 1 hour"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Status</Label>
              <Select 
                name="isActive" 
                value={serviceFormData.isActive.toString()} 
                onValueChange={(value) => handleSelectChange('isActive', value === 'true')}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleCreateOrUpdateService}>
              {selectedService ? 'Save Changes' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the service "{selectedService?.name}"? This action cannot be undone.
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleDeleteService}>
              Delete Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServicesPage;
