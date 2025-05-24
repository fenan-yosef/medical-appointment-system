"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // For isActive
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";

interface Department {
  _id: string;
  name: string;
}

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

export default function AddNewDoctorPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    specialization: "",
    licenseNumber: "",
    department: "", // Department ID
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    dateOfBirth: "",
    gender: "",
    profileImage: "",
    isActive: true,
  });

  // Fetch departments for the select dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await fetch("/api/departments");
        if (!response.ok) throw new Error("Failed to fetch departments");
        const data = await response.json();
        setDepartments(data.departments || []);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
     if (name === "isActive") {
        setFormData((prev) => ({ ...prev, [name]: value === "true" || value === true }));
     } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
     }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { firstName, lastName, email, password, specialization, department } = formData;
    if (!firstName || !lastName || !email || !password || !specialization || !department) {
      const errMsg = "Please fill in all required fields: First Name, Last Name, Email, Password, Specialization, and Department.";
      setError(errMsg);
      toast({ title: "Missing Fields", description: errMsg, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
        const errMsg = "Password must be at least 6 characters long.";
        setError(errMsg);
        toast({ title: "Invalid Password", description: errMsg, variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.status === 201) {
        toast({ title: "Success!", description: "New doctor account created successfully." });
        router.push("/dashboard/admin/doctors"); 
      } else {
        setError(result.message || "Failed to create doctor account.");
        toast({ title: "Error", description: result.message || "Failed to create doctor account.", variant: "destructive" });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast({ title: "Error", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors List
      </Button>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Doctor</CardTitle>
          <CardDescription>Enter the details for the new doctor account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && <p className="text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            
            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Basic Information <span className="text-red-500">*</span></legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
                <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
                <div><Label htmlFor="email">Email Address</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required /></div>
                <div><Label htmlFor="password">Initial Password</Label><Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required /></div>
                <div><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} /></div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Professional Details <span className="text-red-500">*</span></legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div><Label htmlFor="specialization">Specialization</Label><Input id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} required /></div>
                <div><Label htmlFor="licenseNumber">License Number</Label><Input id="licenseNumber" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} /></div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" value={formData.department} onValueChange={(value) => handleSelectChange("department", value)} disabled={isLoadingDepartments} required>
                    <SelectTrigger><SelectValue placeholder={isLoadingDepartments ? "Loading..." : "Select Department"} /></SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>
            
            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Contact & Other</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                 <div><Label htmlFor="phoneNumber">Phone Number</Label><Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
                 <div><Label htmlFor="profileImage">Profile Image URL</Label><Input id="profileImage" name="profileImage" value={formData.profileImage} onChange={handleChange} placeholder="https://example.com/image.png"/></div>
              </div>
              <div className="mt-4">
                <Label>Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 border p-3 rounded-md mt-1">
                    <div><Label htmlFor="address.street" className="text-xs">Street</Label><Input id="address.street" name="address.street" value={formData.address.street} onChange={handleChange} /></div>
                    <div><Label htmlFor="address.city" className="text-xs">City</Label><Input id="address.city" name="address.city" value={formData.address.city} onChange={handleChange} /></div>
                    <div><Label htmlFor="address.state" className="text-xs">State</Label><Input id="address.state" name="address.state" value={formData.address.state} onChange={handleChange} /></div>
                    <div><Label htmlFor="address.zipCode" className="text-xs">Zip Code</Label><Input id="address.zipCode" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} /></div>
                    <div className="md:col-span-2"><Label htmlFor="address.country" className="text-xs">Country</Label><Input id="address.country" name="address.country" value={formData.address.country} onChange={handleChange} /></div>
                </div>
              </div>
               <div className="flex items-center space-x-2 mt-4">
                <Checkbox id="isActive" name="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleSelectChange("isActive", Boolean(checked))} />
                <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Account is Active
                </Label>
              </div>
            </fieldset>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admin/doctors")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingDepartments}>
              {isLoading ? "Creating Account..." : "Create Doctor Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
