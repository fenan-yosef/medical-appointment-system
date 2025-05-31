import * as React from "react";

export const Dialog = ({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}) =>
    open ? (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => onOpenChange(false)}
        >
            {children}
        </div>
    ) : null;

export const DialogContent = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`bg-white rounded-lg shadow-lg p-6 ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
    >
        {children}
    </div>
);

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-bold mb-2">{children}</h2>
);

export const DialogDescription = ({
    children,
}: {
    children: React.ReactNode;
}) => <p className="text-gray-600 mb-2">{children}</p>;

export const DialogFooter = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`mt-4 flex justify-end gap-2 ${className || ""}`}>
        {children}
    </div>
);

export const DialogTrigger = ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
);

export const DialogClose = ({
    asChild,
    children,
}: {
    asChild?: boolean;
    children: React.ReactNode;
}) => (
    <span style={{ cursor: "pointer" }}>{children}</span>
);
