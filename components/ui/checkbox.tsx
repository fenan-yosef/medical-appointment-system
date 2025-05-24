import * as React from "react";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
    onCheckedChange?: (checked: boolean) => void;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = "", onCheckedChange, ...props }, ref) => (
        <input
            type="checkbox"
            ref={ref}
            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
            onChange={e => onCheckedChange?.(e.target.checked)}
            {...props}
        />
    )
);
Checkbox.displayName = "Checkbox";