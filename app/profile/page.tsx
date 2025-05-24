import React, { useContext } from "react";
import { ThemeContext } from "../../components/theme-provider";

export default function ProfilePage() {
    const { theme } = useContext(ThemeContext);
    return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === "dark" ? "bg-[#23272e] text-white" : "bg-[#c7d2cc] text-black"}`}>
            <div className="bg-white dark:bg-[#23272e] rounded border border-gray-200 dark:border-gray-700 shadow-lg w-[350px] p-8">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                {/* Add profile view/edit form here */}
            </div>
        </div>
    );
}
