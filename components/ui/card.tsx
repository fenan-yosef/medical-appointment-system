import * as React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`bg-white dark:bg-gray-900 rounded shadow p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`mb-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
}

// Add this:
export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`mt-4 flex items-center gap-2 ${className}`}>{children}</div>;
}