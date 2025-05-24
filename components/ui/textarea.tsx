import * as React from "react";

export const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
    <textarea
        ref={ref}
        className={`border rounded px-3 py-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
        {...props}
    />
));
Textarea.displayName = "Textarea";