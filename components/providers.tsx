// app/providers.tsx
"use client"; // <--- THIS DIRECTIVE IS CRUCIAL!

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth"; // Import Session type if you use it

interface ProvidersProps {
    children: React.ReactNode;
    session: Session | null; // Pass the initial session from getServerSession
}

export default function Providers({ children, session }: ProvidersProps) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
}