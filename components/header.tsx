"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // Ensure this path is correct or create the file if missing

interface HeaderProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function Header({ user }: HeaderProps) {
    const pathname = usePathname() || "" // Provide a default value if pathname is null
    const [searchQuery, setSearchQuery] = useState("")

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = () => {
        const paths = pathname.split("/").filter(Boolean)

        return paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join("/")}`
            const isLast = index === paths.length - 1
            const label = path.charAt(0).toUpperCase() + path.slice(1)

            return {
                href,
                label,
                isLast,
            }
        })
    }

    const breadcrumbs = generateBreadcrumbs()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Searching for:", searchQuery)
        // Implement search functionality
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center bg-white border-b border-gray-200 px-4 md:px-6">
            {/* Breadcrumbs - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-1 text-sm">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                    Home
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                        <span className="mx-1 text-gray-400">/</span>
                        {crumb.isLast ? (
                            <span className="font-medium text-gray-900">{crumb.label}</span>
                        ) : (
                            <Link href={crumb.href} className="text-gray-500 hover:text-gray-700">
                                {crumb.label}
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Search - grows to fill space */}
            <div className="flex-1 mx-4">
                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full bg-gray-50 pl-9 focus:bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">{user?.name?.charAt(0) || "U"}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <span>{user?.name || "User"}</span>
                                <span className="text-xs font-normal text-gray-500">{user?.email || "user@example.com"}</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/api/auth/signout">Logout</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
