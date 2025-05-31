// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth"; // Import NextAuthOptions type

// Define authOptions separately and then use it in NextAuth
export const authOptions: NextAuthOptions = { // Export authOptions here
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    await connectToDatabase();

                    // 1. Find user
                    const user = (await User.findOne({ email: credentials?.email })
                        .select("+password")
                        .lean()) as any;

                    if (!user) {
                        console.log("No user found with this email");
                        return null;
                    }

                    // 2. Verify password
                    const isValid = await bcrypt.compare(
                        credentials?.password || "",
                        user.password
                    );

                    // 3. Return user object (without password)
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string; // Ensure id is string
                session.user.role = token.role as string; // Ensure role is string
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// The NextAuth handler uses the authOptions
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };