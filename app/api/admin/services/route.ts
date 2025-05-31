import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/models/Service';
import Department from '@/models/Department'; // Assuming Department model exists

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;
    const name = searchParams.get('name');
    const departmentId = searchParams.get('department');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (departmentId) {
      query.department = departmentId;
    }
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const services = await Service.find(query)
      .populate('department')
      .sort({ [sort]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalServices = await Service.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: services,
      totalPages: Math.ceil(totalServices / limit),
      currentPage: page,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { name, description, department, cost, duration, isActive } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    // Optional: Check if department exists if provided
    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 });
      }
    }

    const newService = new Service({
      name,
      description,
      department,
      cost,
      duration,
      isActive,
    });

    await newService.save();
    return NextResponse.json({ success: true, data: newService }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) { // Duplicate key error for 'name'
      return NextResponse.json({ success: false, error: 'Service name must be unique' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
