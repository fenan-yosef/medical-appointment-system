// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { User as NextAuthUser } from "next-auth"; // Import NextAuthUser if needed here

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials): Promise<NextAuthUser | null> {
                try {
                    await connectToDatabase();

                    if (!credentials?.email || !credentials?.password) {
                        console.log("Missing credentials");
                        return null;
                    }

                    const user = (await User.findOne({ email: credentials.email })
                        .select("+password")
                        .lean()) as any;

                    if (!user) {
                        console.log("No user found with this email");
                        return null;
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isValid) {
                        console.log("Invalid password");
                        return null;
                    }

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
                // @ts-ignore
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.role = token.role as string;
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