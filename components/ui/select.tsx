import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    value: string;
    onValueChange: (value: string) => void;
}

export function Select({ value, onValueChange, children, className = "", ...props }: SelectProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onValueChange(e.target.value);
    };

    return (
        <select
            value={value}
            onChange={handleChange}
            className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return <option value={value}>{children}</option>;
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function SelectValue({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}