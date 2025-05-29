"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Fallbacks for missing UI components
const Table = (props: React.TableHTMLAttributes<HTMLTableElement>) => <table {...props} />;
const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />;
const TableCell = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props} />;
const TableHead = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th {...props} />;
const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} />;
const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />;
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={"border rounded px-2 py-1 " + (props.className || "")} />;
const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button {...props} className={"px-3 py-1 rounded " + (props.variant === "outline" ? "border" : props.variant === "destructive" ? "bg-red-600 text-white" : "bg-blue-600 text-white") + " " + (props.className || "")} />
);
const Checkbox = (props: { id?: string; name?: string; checked?: boolean; onCheckedChange?: (checked: boolean) => void }) => (
  <input
    type="checkbox"
    id={props.id}
    name={props.name}
    checked={props.checked}
    onChange={e => props.onCheckedChange?.(e.target.checked)}
    className="mr-2"
  />
);
const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) =>
  open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onOpenChange(false)}>{children}</div> : null;
const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) =>
  <div className={`bg-white rounded-lg shadow-lg p-6 ${className || ""}`} onClick={e => e.stopPropagation()}>{children}</div>;
const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-bold mb-2">{children}</h2>;
const DialogDescription = ({ children }: { children: React.ReactNode }) => <p className="text-gray-600 mb-2">{children}</p>;
const DialogFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`mt-4 flex justify-end gap-2 ${className || ""}`}>{children}</div>;
const DialogClose = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => (
  <span style={{ cursor: "pointer" }}>{children}</span>
);
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    if (typeof window !== "undefined") {
      alert(`${title}\n${description}`);
    }
  },
});
// Fallback icons
const UserCog = () => <span title="Edit">🛠️</span>;
const KeyRound = () => <span title="Reset Password">🔑</span>;
const UserX = () => <span title="Deactivate">❌</span>;
const UserCheck = () => <span title="Activate">✅</span>;
const ChevronLeft = () => <span>{"<"}</span>;
const ChevronRight = () => <span>{">"}</span>;
const Search = () => <span>🔍</span>;

// Data Interfaces (mirroring backend User model for patients)
interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface EmergencyContact {
  name?: string;
  relationship?: string;
  phoneNumber?: string;
}

interface Insurance {
  provider?: string;
  policyNumber?: string;
  expiryDate?: string; // ISO string
}

interface PatientProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: Address;
  dateOfBirth?: string; // ISO string
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  emergencyContact?: EmergencyContact;
  insurance?: Insurance;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const GENDERS: PatientProfile["gender"][] = ["male", "female", "other", "prefer_not_to_say"];

export default function AdminPatientsPage() {
  console.log("Rendering Patients page"); // NEW: debug log in render

  const { toast } = useToast();
  const router = useRouter();

  // Data states
  const [patientsList, setPatientsList] = useState<PatientProfile[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    email: "",
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
    totalPatients: 0,
    limit: 10,
  });

  // Modal states
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<PatientProfile>>({});
  const [isResetPasswordConfirmOpen, setIsResetPasswordConfirmOpen] = useState(false);
  const [resetPasswordFeedback, setResetPasswordFeedback] = useState<string | null>(null);


  const memoizedFilters = useMemo(() => filters, [filters.name, filters.email, filters.isActive]);
  const memoizedSorting = useMemo(() => sorting, [sorting.sortBy, sorting.order]);
  const memoizedPagination = useMemo(() => pagination, [pagination.currentPage, pagination.limit]);

  const fetchPatientsList = useCallback(async () => {
    console.log("Fetching patients"); // NEW: debug log in fetch
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append("name", filters.name);
      if (filters.email) params.append("email", filters.email);
      if (filters.isActive !== "") params.append("isActive", filters.isActive);

      params.append("sortBy", sorting.sortBy);
      params.append("order", sorting.order);
      params.append("page", pagination.currentPage.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/patients?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch patients list");
      }
      const data = await response.json();
      setPatientsList(data.patients || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1,
        totalPatients: data.totalPatients || 0,
      }));
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [memoizedFilters, memoizedSorting, memoizedPagination, toast]);

  useEffect(() => {
    fetchPatientsList();
  }, [fetchPatientsList]);

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

  const openEditModal = async (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setIsLoadingModalData(true);
    try {
      const response = await fetch(`/api/admin/patients/${patient._id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch patient details.");
      }
      const data = await response.json();
      setEditFormData({
        ...data.patient,
        dateOfBirth: data.patient.dateOfBirth ? new Date(data.patient.dateOfBirth).toISOString().split('T')[0] : "",
        insurance: {
          ...data.patient.insurance,
          expiryDate: data.patient.insurance?.expiryDate ? new Date(data.patient.insurance.expiryDate).toISOString().split('T')[0] : "",
        }
      });
      setIsEditModalOpen(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length > 1) {
      setEditFormData(prev => {
        const newState = { ...prev };
        let currentLevel = newState;
        for (let i = 0; i < keys.length - 1; i++) {
          // @ts-ignore
          currentLevel[keys[i]] = { ...currentLevel[keys[i]] };
          // @ts-ignore
          currentLevel = currentLevel[keys[i]];
        }
        // @ts-ignore
        currentLevel[keys[keys.length - 1]] = value;
        return newState;
      });
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditCheckboxChange = (name: string, checked: boolean) => {
    setEditFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsLoading(true);
    try {
      const { _id, createdAt, updatedAt, ...payload } = editFormData;

      const response = await fetch(`/api/admin/patients/${selectedPatient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update patient profile.");
      }
      toast({ title: "Success", description: "Patient profile updated successfully." });
      setIsEditModalOpen(false);
      fetchPatientsList();
    } catch (err: any) {
      toast({ title: "Error updating profile", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openResetPasswordConfirm = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setResetPasswordFeedback(null);
    setIsResetPasswordConfirmOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedPatient) return;
    setIsLoading(true); // Can use a specific loading state for this action
    try {
      const response = await fetch(`/api/admin/patients/${selectedPatient._id}/reset-password`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to trigger password reset.");
      }
      setResetPasswordFeedback(`Password reset token generated. For manual sharing: ${result.resetTokenForManualSharing} (URL: ${result.resetUrlForManualSharing})`);
      toast({ title: "Success", description: "Password reset process initiated." });
      // setIsResetPasswordConfirmOpen(false); // Keep open to show feedback or close after a delay
    } catch (err: any) {
      setResetPasswordFeedback(null);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActiveStatus = async (patient: PatientProfile) => {
    const newStatus = !patient.isActive;
    try {
      const response = await fetch(`/api/admin/patients/${patient._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update patient status.");
      }
      toast({ title: "Success", description: `Patient status updated to ${newStatus ? 'Active' : 'Inactive'}.` });
      fetchPatientsList(); // Refresh list
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Patient Accounts</h1>

      {/* Filters Section */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
          <Input name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search by Name..." />
          <Input name="email" value={filters.email} onChange={handleFilterChange} placeholder="Search by Email..." />
          <select
            name="isActive"
            value={filters.isActive}
            onChange={e => handleSelectFilterChange("isActive", e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button onClick={() => fetchPatientsList()} className="w-full md:w-auto">
            <Search /> Apply
          </Button>
        </div>
      </div>

      {isLoading && !isEditModalOpen && <p className="text-center text-gray-600 py-4">Loading patients...</p>}
      {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      {/* Table Section */}
      {!isLoading && !error && (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSortChange('lastName')} className="cursor-pointer">Name</TableHead>
                <TableHead onClick={() => handleSortChange('email')} className="cursor-pointer">Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead onClick={() => handleSortChange('dateOfBirth')} className="cursor-pointer">Date of Birth</TableHead>
                <TableHead onClick={() => handleSortChange('isActive')} className="cursor-pointer">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientsList.length > 0 ? (
                patientsList.map((patient) => (
                  <TableRow key={patient._id}>
                    <TableCell>{patient.firstName} {patient.lastName}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phoneNumber || "N/A"}</TableCell>
                    <TableCell>{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {patient.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="icon" onClick={() => openEditModal(patient)} title="Edit Details" disabled={isLoadingModalData}>
                        <UserCog />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openResetPasswordConfirm(patient)} title="Reset Password">
                        <KeyRound />
                      </Button>
                      <Button variant={patient.isActive ? "destructive" : "default"} size="icon" onClick={() => handleToggleActiveStatus(patient)} title={patient.isActive ? "Deactivate" : "Activate"}>
                        {patient.isActive ? <UserX /> : <UserCheck />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">No patients found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Section */}
      {!isLoading && !error && patientsList.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600">
            Showing {Math.min(1 + (pagination.currentPage - 1) * pagination.limit, pagination.totalPatients)}
            to {Math.min(pagination.currentPage * pagination.limit, pagination.totalPatients)} of {pagination.totalPatients} patients
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} size="sm">
              <ChevronLeft /> Previous
            </Button>
            <span className="text-sm p-2">Page {pagination.currentPage} of {pagination.totalPages}</span>
            <Button variant="outline" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} size="sm">
              Next <ChevronRight />
            </Button>
          </div>
          <select
            value={pagination.limit.toString()}
            onChange={e => setPagination(p => ({ ...p, limit: parseInt(e.target.value), currentPage: 1 }))}
            className="border rounded px-2 py-1 w-24"
          >
            <option value="10">10/page</option>
            <option value="20">20/page</option>
            <option value="50">50/page</option>
          </select>
        </div>
      )}

      {/* View/Edit Details Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Patient Profile: {selectedPatient?.firstName} {selectedPatient?.lastName}</DialogTitle>
            <DialogDescription>Modify the patient's details below. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {isLoadingModalData && <p className="text-center py-4">Loading patient details...</p>}
          {!isLoadingModalData && selectedPatient && (
            <form onSubmit={handleEditSubmit} className="space-y-3 max-h-[75vh] overflow-y-auto p-1 pr-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" value={editFormData.firstName || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" value={editFormData.lastName || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={editFormData.email || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="phoneNumber">Phone Number</Label><Input id="phoneNumber" name="phoneNumber" value={editFormData.phoneNumber || ""} onChange={handleEditFormChange} /></div>
                <div><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" name="dateOfBirth" type="date" value={editFormData.dateOfBirth || ""} onChange={handleEditFormChange} /></div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    name="gender"
                    value={editFormData.gender || ""}
                    onChange={e => setEditFormData(prev => ({ ...prev, gender: e.target.value as PatientProfile["gender"] }))}
                    className="border rounded px-2 py-1"
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map(g =>
                      g ? (
                        <option key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1).replace(/_/g, " ")}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>
              </div>

              <fieldset className="border p-3 rounded-md"><legend className="text-sm font-medium px-1">Address</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-1">
                  <div><Label htmlFor="address.street" className="text-xs">Street</Label><Input id="address.street" name="address.street" value={editFormData.address?.street || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="address.city" className="text-xs">City</Label><Input id="address.city" name="address.city" value={editFormData.address?.city || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="address.state" className="text-xs">State</Label><Input id="address.state" name="address.state" value={editFormData.address?.state || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="address.zipCode" className="text-xs">Zip Code</Label><Input id="address.zipCode" name="address.zipCode" value={editFormData.address?.zipCode || ""} onChange={handleEditFormChange} /></div>
                  <div className="md:col-span-2"><Label htmlFor="address.country" className="text-xs">Country</Label><Input id="address.country" name="address.country" value={editFormData.address?.country || ""} onChange={handleEditFormChange} /></div>
                </div>
              </fieldset>

              <fieldset className="border p-3 rounded-md"><legend className="text-sm font-medium px-1">Emergency Contact</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 mt-1">
                  <div><Label htmlFor="emergencyContact.name" className="text-xs">Name</Label><Input id="emergencyContact.name" name="emergencyContact.name" value={editFormData.emergencyContact?.name || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="emergencyContact.relationship" className="text-xs">Relationship</Label><Input id="emergencyContact.relationship" name="emergencyContact.relationship" value={editFormData.emergencyContact?.relationship || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="emergencyContact.phoneNumber" className="text-xs">Phone</Label><Input id="emergencyContact.phoneNumber" name="emergencyContact.phoneNumber" value={editFormData.emergencyContact?.phoneNumber || ""} onChange={handleEditFormChange} /></div>
                </div>
              </fieldset>

              <fieldset className="border p-3 rounded-md"><legend className="text-sm font-medium px-1">Insurance</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 mt-1">
                  <div><Label htmlFor="insurance.provider" className="text-xs">Provider</Label><Input id="insurance.provider" name="insurance.provider" value={editFormData.insurance?.provider || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="insurance.policyNumber" className="text-xs">Policy No.</Label><Input id="insurance.policyNumber" name="insurance.policyNumber" value={editFormData.insurance?.policyNumber || ""} onChange={handleEditFormChange} /></div>
                  <div><Label htmlFor="insurance.expiryDate" className="text-xs">Expiry</Label><Input id="insurance.expiryDate" name="insurance.expiryDate" type="date" value={editFormData.insurance?.expiryDate || ""} onChange={handleEditFormChange} /></div>
                </div>
              </fieldset>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isActive" name="isActive" checked={editFormData.isActive} onCheckedChange={(checked) => handleEditCheckboxChange("isActive", Boolean(checked))} />
                <Label htmlFor="isActive">Account is Active</Label>
              </div>

              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={isResetPasswordConfirmOpen} onOpenChange={setIsResetPasswordConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Password Reset</DialogTitle>
            <DialogDescription>
              Are you sure you want to initiate a password reset for {selectedPatient?.firstName} {selectedPatient?.lastName}?
              This will generate a reset token and conceptually send an email to the patient.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordFeedback && (
            <div className="my-2 p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-xs">
              <p className="font-semibold">Action Required:</p>
              <p>{resetPasswordFeedback}</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleResetPassword} disabled={isLoading || !!resetPasswordFeedback}>
              {isLoading ? "Initiating..." : "Yes, initiate reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
