"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

// Fallback implementations for missing imports
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />;
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    if (typeof window !== "undefined") {
      alert(`${title}\n${description}`);
    }
  },
});

export default function AddNewPatientPage() {
  const router = useRouter();
  const { toast } = useToast(); // For displaying notifications

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phoneNumber: "",
    },
    insurance: {
      provider: "",
      policyNumber: "",
      expiryDate: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          // @ts-ignore
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic frontend validation (more can be added)
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.dateOfBirth || !formData.gender) {
      setError("Please fill in all required fields: First Name, Last Name, Email, Password, Date of Birth, Gender.");
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "patient", // Explicitly set role
        }),
      });

      const result = await response.json();

      if (response.status === 201) {
        toast({
          title: "Success!",
          description: "New patient registered successfully.",
        });
        // Clear form or redirect
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          dateOfBirth: "",
          gender: "",
          phoneNumber: "",
          address: { street: "", city: "", state: "", zipCode: "", country: "" },
          emergencyContact: { name: "", relationship: "", phoneNumber: "" },
          insurance: { provider: "", policyNumber: "", expiryDate: "" },
        });
        // router.push("/dashboard/receptionist"); // Optional redirect
      } else {
        setError(result.message || "Failed to register patient.");
        toast({
          title: "Error",
          description: result.message || "Failed to register patient.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 p-4 md:p-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Add New Patient</CardTitle>
          <CardDescription>Enter the details of the new patient below.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
              <p className="text-xs text-muted-foreground">Initial password for the patient. They can change it later.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={isLoading}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            </div>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Address</legend>
              <div className="space-y-4">
                <Label htmlFor="address.street">Street</Label>
                <Input id="address.street" name="address.street" value={formData.address.street} onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address.city">City</Label>
                    <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="address.state">State</Label>
                    <Input id="address.state" name="address.state" value={formData.address.state} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="address.zipCode">Zip Code</Label>
                    <Input id="address.zipCode" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} />
                  </div>
                </div>
                <Label htmlFor="address.country">Country</Label>
                <Input id="address.country" name="address.country" value={formData.address.country} onChange={handleChange} />
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Emergency Contact</legend>
              <div className="space-y-4">
                <Label htmlFor="emergencyContact.name">Name</Label>
                <Input id="emergencyContact.name" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} />
                <Label htmlFor="emergencyContact.relationship">Relationship</Label>
                <Input id="emergencyContact.relationship" name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} />
                <Label htmlFor="emergencyContact.phoneNumber">Phone Number</Label>
                <Input id="emergencyContact.phoneNumber" name="emergencyContact.phoneNumber" value={formData.emergencyContact.phoneNumber} onChange={handleChange} />
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Insurance Details</legend>
              <div className="space-y-4">
                <Label htmlFor="insurance.provider">Provider</Label>
                <Input id="insurance.provider" name="insurance.provider" value={formData.insurance.provider} onChange={handleChange} />
                <Label htmlFor="insurance.policyNumber">Policy Number</Label>
                <Input id="insurance.policyNumber" name="insurance.policyNumber" value={formData.insurance.policyNumber} onChange={handleChange} />
                <Label htmlFor="insurance.expiryDate">Expiry Date</Label>
                <Input id="insurance.expiryDate" name="insurance.expiryDate" type="date" value={formData.insurance.expiryDate} onChange={handleChange} />
              </div>
            </fieldset>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/receptionist")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding Patient..." : "Add Patient"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
