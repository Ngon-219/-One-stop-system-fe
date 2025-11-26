"use client"

import NavBar from "@/app/components/navbar"
import ManagerNavBar from "@/app/components/manager-navbar"

export default function DashboardPage() {
    return (
        <div className="w-full h-full">
            <NavBar />
            <ManagerNavBar />
            <div className="w-[90vw] mx-auto py-8">
                <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            </div>
        </div>
    )
}