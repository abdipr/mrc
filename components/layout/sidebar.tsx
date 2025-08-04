"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Home, Package, Users, FileText, RotateCcw, History, Settings, LogOut, Sun, Moon, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/auth"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Peminjaman", href: "/peminjaman", icon: FileText },
  { name: "Pengembalian", href: "/pengembalian", icon: RotateCcw },
  { name: "Riwayat", href: "/riwayat", icon: History },
  { name: "Barang", href: "/barang", icon: Package },
  { name: "Peminjam", href: "/peminjam", icon: Users },
  { name: "Pengaturan", href: "/pengaturan", icon: Settings },
]

export default function Sidebar() {
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const user = auth.getCurrentUser()

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const handleLogout = () => {
    auth.logout()
    router.push("/login")
  }

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6 py-1 border-b border-gray-200 dark:border-gray-700">
        <img
          src="/mrc.png"
          alt="MRC"
          className="h-14 object-contain p-4 mx-auto"
        />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300",
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {/* Theme toggle and notifications */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{user?.name?.charAt(0) || "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">MRC Admin</div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
