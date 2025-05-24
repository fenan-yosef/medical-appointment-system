"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive";
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "default", ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex items-center p-4 rounded-md",
                variant === "destructive" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700",
                className
            )}
            {...props}
        />
    )
);
Alert.displayName = "Alert";

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn("text-sm", className)} {...props} />
    )
);
AlertDescription.displayName = "AlertDescription";
