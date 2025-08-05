"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Laptop, Cable, Projector, Mouse, Tablet, Printer, Monitor, Keyboard, Speaker, HdmiPort, Plug, Presentation, MicVocal } from "lucide-react"
// Icon mapping for items (same as barang page)
const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  laptop: <Laptop className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  cable: <Cable className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  projector: <Projector className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  hdmi: <HdmiPort className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  plug: <Plug className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  mouse: <Mouse className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  tablet: <Tablet className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  printer: <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  monitor: <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  keyboard: <Keyboard className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  speaker: <Speaker className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  presentation: <Presentation className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  mic: <MicVocal className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
  other: <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
}
import { Package, Users, FileText, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import Loading from "@/components/ui/loading"
import Alert from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"
import type { DashboardStats, LoanWithDetails } from "@/lib/types"
import { formatDate, isOverdue } from "@/lib/utils"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLoans, setRecentLoans] = useState<LoanWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }

    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [statsData, loansData] = await Promise.all([api.getDashboardStats(), api.getLoans()])

      setStats(statsData)
      // Sort by createdAt descending (newest first)
      const sortedLoans = [...loansData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecentLoans(sortedLoans.slice(0, 5))
    } catch (err) {
      setError("Gagal memuat data dashboard")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!auth.isAuthenticated()) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Barang",
      value: stats?.totalItems || 0,
      icon: Package,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-600/30",
      iconColor: "text-blue-200",
      textColor: "text-blue-100",
    },
    {
      title: "Total Peminjam",
      value: stats?.totalBorrowers || 0,
      icon: Users,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-600/30",
      iconColor: "text-green-200",
      textColor: "text-green-100",
    },
    {
      title: "Sedang Dipinjam",
      value: stats?.activeLoan || 0,
      icon: Clock,
      gradient: "from-yellow-500 to-yellow-600",
      iconBg: "bg-yellow-600/30",
      iconColor: "text-yellow-200",
      textColor: "text-yellow-100",
    },
    {
      title: "Terlambat",
      value: stats?.overdueLoan || 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
      iconBg: "bg-red-600/30",
      iconColor: "text-red-200",
      textColor: "text-red-100",
    },
  ]

  return (
    <div className="p-4 lg:p-6 max-h-screen overflow-y-auto animate-fade-in duration-200">
      <Card className="mb-6 p-0 bg-transparent border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">Ringkasan aktivitas peminjaman barang sekolah</CardDescription>
        </CardHeader>
        {error && (
          <CardContent className="p-0 pt-2"><Alert type="error">{error}</Alert></CardContent>
        )}
      </Card>

      {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-md rounded-lg`}>
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <div className={`${stat.textColor} text-xs font-medium`}>{stat.title}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
                <div className={`rounded-full ${stat.iconBg} p-2`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Loans Card - styled like Pengembalian */}
      <Card className="card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Peminjaman Terbaru</CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">5 data terakhir</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentLoans.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada data peminjaman</p>
            </div>
          ) : (
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 py-2">Peminjam</TableHead>
                  <TableHead className="px-3 py-2">Barang</TableHead>
                  <TableHead className="px-3 py-2">Jatuh Tempo</TableHead>
                  <TableHead className="px-3 py-2">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLoans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors ${
                      isOverdue(loan.dueDate) && loan.status === "dipinjam"
                      ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-800/20"
                      : ""
                    } cursor-pointer`}
                  >
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-base font-semibold">
                            {loan.borrower?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{loan.borrower?.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{loan.borrower?.nip}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        {loan.itemDetails && loan.itemDetails.length > 0 ? (
                          loan.itemDetails.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                {ICON_COMPONENTS[item.icon || "laptop"] || <Laptop className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-semibold">{item.quantity}</span>x
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium">
                      <div className={isOverdue(loan.dueDate) && loan.status === "dipinjam" ? "text-red-600 dark:text-red-400" : ""}>
                        {formatDate(loan.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      {loan.status === "dikembalikan" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Dikembalikan
                        </span>
                      ) : isOverdue(loan.dueDate) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-4 h-4 mr-1" />
                          Dipinjam
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
