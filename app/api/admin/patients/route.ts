import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User'; // Using the updated User model
import bcrypt from 'bcryptjs';

// GET all patients with pagination, search, and sorting
export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;
    const searchQuery = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const query: any = { role: 'patient' };

    if (searchQuery) {
      query.$or = [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phoneNumber: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }


    const patients = await User.find(query)
      .sort({ [sort]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password') // Exclude password from results
    // .lean();

    const totalPatients = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      patients,
      totalPages: Math.ceil(totalPatients / limit),
      currentPage: page,
      totalPatients,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST to create a new patient
export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      gender,
      profileImage,
      // Patient Record Fields (can be initialized during creation)
      emergencyContact,
      insurance,
      medicalHistory,
      allergies,
      currentMedications,
      pastSurgeries,
      familyHistory,
      bloodType,
      vaccinations,
      isActive // Admin can set this
    } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: 'Missing required fields: email, password, firstName, lastName are mandatory.' }, { status: 400 });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return NextResponse.json({ message: 'Email already exists.' }, { status: 409 });
    }

    // Note: Password hashing is handled by the UserSchema.pre('save') hook
    const newPatient = new User({
      email,
      password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role: 'patient', // Explicitly set role
      phoneNumber,
      address,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      profileImage,
      isActive: typeof isActive === 'boolean' ? isActive : true, // Default to true if not provided
      // Patient Record Fields
      emergencyContact: emergencyContact || undefined,
      insurance: insurance || undefined,
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      currentMedications: currentMedications || [],
      pastSurgeries: pastSurgeries || [],
      familyHistory: familyHistory || [],
      bloodType: bloodType || undefined,
      vaccinations: vaccinations || [],
    });

    await newPatient.save();

    // Exclude password from the returned object
    const patientResponse = newPatient.toObject();
    delete patientResponse.password;

    return NextResponse.json({ success: true, patient: patientResponse }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) { // Duplicate key error
      return NextResponse.json({ message: 'Duplicate field value entered.', error: error.keyValue }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
