// lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { NextRequest } from "next/server";

// Import authOptions from the new utility file
import { authOptions } from "@/lib/auth";

// The NextAuth handler uses the authOptions
const handler = NextAuth(authOptions);

// Define the context type that .next/types expects for its checks.
// For a catch-all route like [...nextauth], params would be { nextauth: string[] }
interface AppRouterExpectedContext {
    params: Promise<{ nextauth?: string[] | undefined }>; // Changed: params is a Promise
}

// Export wrapped GET and POST handlers
export async function GET(request: NextRequest, context: AppRouterExpectedContext) {
    return handler(request, context as any);
}

export async function POST(request: NextRequest, context: AppRouterExpectedContext) {
    return handler(request, context as any);
}