export function useToast() {
    return {
        toast: ({
            title,
            description,
            variant,
        }: { title: string; description: string; variant?: string }) => {
            if (typeof window !== "undefined") {
                alert(`${title}\n${description}`);
            }
        },
    };
}
