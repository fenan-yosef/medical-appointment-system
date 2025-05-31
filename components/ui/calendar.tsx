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
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",

                // Caption (month/year display) styling
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",

                // Navigation buttons (prev/next month)
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }), // Apply button styles
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" // Specific overrides
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",

                // Table structure for days
                table: "w-full border-collapse space-y-1",
                head_row: "flex ",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]", // Day names
                row: "flex w-full mt-2",

                // Individual day cells
                cell: "h-9 w-9 text-center text-sm p-0 relative " +
                    "[&:has([aria-selected].day-range-end)]:rounded-r-md " + // Rounded right for range end
                    "[&:has([aria-selected].day-outside)]:bg-accent/50 " + // Background for selected outside days
                    "[&:has([aria-selected])]:bg-accent " + // Background for all selected days
                    "first:[&:has([aria-selected])]:rounded-l-md " + // Rounded left for first selected day in range
                    "last:[&:has([aria-selected])]:rounded-r-md " + // Rounded right for last selected day in range
                    "focus-within:relative focus-within:z-20", // Z-index for focused elements

                // Styling for the day button itself
                day: cn(
                    buttonVariants({ variant: "ghost" }), // Base button styles for days
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),

                // Specific day states
                day_range_end: "day-range-end", // Custom class for range end
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground", // Highlight today's date
                day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible", // For days that should not be visible

                // Merge any custom classNames provided by the user
                ...classNames,
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

export { Calendar }