"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // For reason and notes

// Fallback implementations for missing imports
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />;
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    if (typeof window !== "undefined") {
      alert(`${title}\n${description}`);
    }
  },
});

interface Department {
  _id: string;
  name: string;
  description?: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  specialization?: string;
  department?: { _id: string; name: string }; // Assuming department is populated
}

export default function ScheduleAppointmentPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [patientId, setPatientId] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Data fetching states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await fetch("/api/departments");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch departments");
        }
        const data = await response.json();
        setDepartments(data.departments || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [toast]);

  // Fetch doctors when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const fetchDoctors = async () => {
        setIsLoadingDoctors(true);
        setDoctors([]); // Clear previous doctors
        setSelectedDoctor(""); // Reset selected doctor
        try {
          const response = await fetch(`/api/doctors?departmentId=${selectedDepartment}`);
          if (!response.ok) {
            const errorData = await response.json();
            // It's possible no doctors are found (404), which isn't necessarily a toast-worthy error
            if (response.status === 404) {
              toast({ title: "Info", description: errorData.message || "No doctors found for this department.", variant: "default" });
            } else {
              throw new Error(errorData.message || "Failed to fetch doctors");
            }
          }
          const data = await response.json();
          setDoctors(data.doctors || []);
        } catch (err: any) {
          setError(err.message);
          toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
          setIsLoadingDoctors(false);
        }
      };
      fetchDoctors();
    } else {
      setDoctors([]); // Clear doctors if no department is selected
      setSelectedDoctor("");
    }
  }, [selectedDepartment, toast]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!patientId || !selectedDepartment || !selectedDoctor || !appointmentDate || !startTime || !endTime || !reason) {
      const missingFieldsError = "Please fill in all required fields: Patient ID, Department, Doctor, Date, Start Time, End Time, and Reason.";
      setError(missingFieldsError);
      toast({ title: "Error", description: missingFieldsError, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientId,
          department: selectedDepartment,
          doctor: selectedDoctor,
          date: appointmentDate,
          time: { start: startTime, end: endTime },
          reason,
          notes,
        }),
      });

      const result = await response.json();

      if (response.status === 201) {
        toast({ title: "Success!", description: "Appointment scheduled successfully." });
        // Clear form
        setPatientId("");
        setSelectedDepartment("");
        setSelectedDoctor("");
        setAppointmentDate("");
        setStartTime("");
        setEndTime("");
        setReason("");
        setNotes("");
        // router.push("/dashboard/receptionist"); // Optional redirect
      } else {
        setError(result.message || "Failed to schedule appointment.");
        toast({ title: "Error", description: result.message || "Failed to schedule appointment.", variant: "destructive" });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast({ title: "Error", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-100 p-4 md:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Schedule New Appointment</CardTitle>
          <CardDescription>Fill in the details to schedule a new appointment.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && <p className="text-sm text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

            <div>
              <Label htmlFor="patientId">Patient ID <span className="text-red-500">*</span></Label>
              <Input
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter known Patient ID"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Currently, enter a known Patient ID. Patient search functionality will be enhanced later.
              </p>
            </div>

            <div>
              <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
              <Select
                name="department"
                onValueChange={setSelectedDepartment}
                value={selectedDepartment}
                disabled={isLoadingDepartments}
                required
              >
                <SelectTrigger>
                  <SelectValue>
                    {isLoadingDepartments
                      ? "Loading departments..."
                      : selectedDepartment
                        ? departments.find(d => d._id === selectedDepartment)?.name
                        : "Select department"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="doctor">Doctor <span className="text-red-500">*</span></Label>
              <Select
                name="doctor"
                onValueChange={setSelectedDoctor}
                value={selectedDoctor}
                disabled={!selectedDepartment || isLoadingDoctors || doctors.length === 0}
                required
              >
                <SelectTrigger>
                  <SelectValue>
                    {isLoadingDoctors
                      ? "Loading doctors..."
                      : !selectedDepartment
                        ? "Select a department first"
                        : doctors.length === 0
                          ? "No doctors available"
                          : selectedDoctor
                            ? doctors.find(d => d._id === selectedDoctor)?.firstName + " " + doctors.find(d => d._id === selectedDoctor)?.lastName
                            : "Select doctor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doc) => (
                    <SelectItem key={doc._id} value={doc._id}>
                      {doc.firstName} {doc.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="appointmentDate">Date <span className="text-red-500">*</span></Label>
                <Input id="appointmentDate" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time <span className="text-red-500">*</span></Label>
                <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="endTime">End Time <span className="text-red-500">*</span></Label>
                <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Appointment <span className="text-red-500">*</span></Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe the reason for the visit." required />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes for the appointment." />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/receptionist")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingDepartments || isLoadingDoctors}>
              {isLoading ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
