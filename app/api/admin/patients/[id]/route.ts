import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User'; // Using the updated User model
import mongoose from 'mongoose';

interface Params {
  id: string;
}

// GET a specific patient by ID
export async function GET(request: NextRequest, { params }: { params: Params }) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid patient ID format' }, { status: 400 });
  }

  try {
    const patient = await User.findOne({ _id: id, role: 'patient' });
    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT to update a patient by ID
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid patient ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Fields that can be updated by admin for a patient
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      dateOfBirth,
      gender,
      profileImage,
      isActive,
      // Patient Record Fields
      emergencyContact,
      insurance, // Renamed from insuranceInformation in previous model version
      medicalHistory,
      allergies,
      currentMedications,
      pastSurgeries,
      familyHistory,
      bloodType,
      vaccinations,
    } = body;

    const patientToUpdate = await User.findOne({ _id: id, role: 'patient' });

    if (!patientToUpdate) {
      return NextResponse.json({ message: 'Patient not found or user is not a patient' }, { status: 404 });
    }

    // Basic Info
    if (firstName) patientToUpdate.firstName = firstName;
    if (lastName) patientToUpdate.lastName = lastName;
    if (email && email !== patientToUpdate.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
            return NextResponse.json({ message: 'Email already in use by another account.' }, { status: 409 });
        }
        patientToUpdate.email = email;
        // Consider email verification status if email is changed
        // patientToUpdate.isEmailVerified = false; 
    }
    if (phoneNumber) patientToUpdate.phoneNumber = phoneNumber;
    if (address) patientToUpdate.address = address;
    if (dateOfBirth) patientToUpdate.dateOfBirth = new Date(dateOfBirth);
    if (gender) patientToUpdate.gender = gender;
    if (profileImage) patientToUpdate.profileImage = profileImage;
    if (typeof isActive === 'boolean') patientToUpdate.isActive = isActive;

    // Patient Record Fields
    // These objects will either be fully provided or not. Partial updates for sub-documents are tricky without specific logic.
    // For arrays, we typically replace the entire array.
    if (emergencyContact) patientToUpdate.emergencyContact = emergencyContact;
    if (insurance) patientToUpdate.insurance = insurance; // Corrected field name
    if (medicalHistory) patientToUpdate.medicalHistory = medicalHistory;
    if (allergies) patientToUpdate.allergies = allergies;
    if (currentMedications) patientToUpdate.currentMedications = currentMedications;
    if (pastSurgeries) patientToUpdate.pastSurgeries = pastSurgeries;
    if (familyHistory) patientToUpdate.familyHistory = familyHistory;
    if (bloodType) patientToUpdate.bloodType = bloodType;
    if (vaccinations) patientToUpdate.vaccinations = vaccinations;
    
    // Note: Password changes should ideally be handled by a separate, dedicated endpoint for security.
    // If password needs to be updatable here, ensure proper validation and hashing.

    const updatedPatient = await patientToUpdate.save();

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) { // Duplicate key error (e.g. for email)
        return NextResponse.json({ message: 'Duplicate field value entered.', error: error.keyValue }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a patient by ID
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid patient ID format' }, { status: 400 });
  }

  try {
    const patient = await User.findOne({ _id: id, role: 'patient' });
    if (!patient) {
      return NextResponse.json({ message: 'Patient not found or user is not a patient' }, { status: 404 });
    }

    // Consider what should happen on delete:
    // - Soft delete (set isActive = false)?
    // - Hard delete?
    // - Are there dependent records (appointments, etc.) that need handling?
    // For now, performing a hard delete as per typical REST DELETE.
    await User.deleteOne({ _id: id, role: 'patient' });

    return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
