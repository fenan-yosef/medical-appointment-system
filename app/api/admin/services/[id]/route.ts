import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Service from '@/models/Service';
import Department from '@/models/Department'; // Assuming Department model exists

interface Params {
  id: string;
}

// GET a specific service by ID
export async function GET(request: NextRequest, { params }: { params: Params }) {
  await dbConnect();
  const { id } = params;

  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ success: false, error: 'Invalid service ID format' }, { status: 400 });
    }
    const service = await Service.findById(id).populate('department');
    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: service });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT to update a service by ID
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  await dbConnect();
  const { id } = params;

  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ success: false, error: 'Invalid service ID format' }, { status: 400 });
    }
    const body = await request.json();
    const { name, description, department, cost, duration, isActive } = body;

    // Optional: Check if department exists if provided
    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
      }
    }
    
    // Ensure name uniqueness if it's being changed
    if (name) {
      const existingService = await Service.findOne({ name, _id: { $ne: id } });
      if (existingService) {
        return NextResponse.json({ success: false, error: 'Service name must be unique' }, { status: 409 });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { ...body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('department');

    if (!updatedService) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedService });
  } catch (error: any) {
    if (error.code === 11000) { // Duplicate key error
        return NextResponse.json({ success: false, error: 'Service name must be unique' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE a service by ID
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  await dbConnect();
  const { id } = params;

  try {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ success: false, error: 'Invalid service ID format' }, { status: 400 });
    }
    const deletedService = await Service.findByIdAndDelete(id);
    if (!deletedService) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
