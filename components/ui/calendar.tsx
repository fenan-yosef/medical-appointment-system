"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react" // Assuming lucide-react is installed for icons
import { DayPicker, type DayPickerProps } from "react-day-picker" // Import DayPickerProps for better type hinting

import { cn } from "@/lib/utils" // Utility for conditionally joining Tailwind classes
import { buttonVariants } from "@/components/ui/button" // Reusable button styles

// Extend DayPickerProps to include any custom props you might want to add later
export type CalendarProps = DayPickerProps & {
    // Add any specific props for your Calendar component here if needed
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true, // Default to true as per your original code
    ...props // Capture all other DayPicker props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            // Apply base styles and then any additional classNames provided by the user
            className={cn("p-3", className)}
            classNames={{
                // Layout and spacing for months
                months: "space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",

                // Caption (month/year display) styling
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",


                // Styling for the day button itself
                day: cn(
                    buttonVariants({ variant: "ghost" }), // Base button styles for days
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),



            }}
            components={{
                // Use the 'Chevron' component and check the 'orientation' prop
                Chevron: ({ orientation, ...props }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" {...props} />;
                    }
                    return <ChevronRight className="h-4 w-4" {...props} />;
                },
            }}
            {...props}
        />
    )
}

Calendar.displayName = "Calendar"

export { Calendar };