"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Laptop, Cable, Projector, Mouse, Tablet, Printer, Monitor, Keyboard, Speaker, HdmiPort, Plug, Presentation, MicVocal } from "lucide-react"

// Icon options for items, idiomatik seperti barang
const ICON_OPTIONS = [
  { value: "laptop", icon: Laptop },
  { value: "cable", icon: Cable },
  { value: "projector", icon: Projector },
  { value: "hdmi", icon: HdmiPort },
  { value: "plug", icon: Plug },
  { value: "mouse", icon: Mouse },
  { value: "tablet", icon: Tablet },
  { value: "printer", icon: Printer },
  { value: "monitor", icon: Monitor },
  { value: "keyboard", icon: Keyboard },
  { value: "speaker", icon: Speaker },
  { value: "presentation", icon: Presentation },
  { value: "mic", icon: MicVocal },
  { value: "other", icon: Package },
];
import { Package, Users, FileText, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import Loading from "@/components/ui/loading"
import Alert from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { auth } from "@/lib/auth"
import api from "@/lib/api"
import type { DashboardStats, LoanWithDetails } from "@/lib/types"
import { formatDate, isOverdue } from "@/lib/utils"
import { ChartContainer } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLoans, setRecentLoans] = useState<LoanWithDetails[]>([])
  const [allLoans, setAllLoans] = useState<LoanWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  const [activeBorrowers, setActiveBorrowers] = useState(0)

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
      // Fetch dashboard stats, loans, items, borrowers (like riwayat)
      const [statsData, loansData, items, borrowers] = await Promise.all([
        api.getDashboardStats(),
        api.getLoans(),
        api.getItems(),
        api.getBorrowers(),
      ])

      setStats(statsData)

      // Index borrowers and items by id for fast lookup
      const borrowerMap = Object.fromEntries(
        (borrowers || []).map((b) => [b.id?.toString(), b])
      )
      const itemMap = Object.fromEntries(
        (items || []).map((item) => [item.id?.toString(), item])
      )

      // Gabungkan semua data ke satu array
      const mapped: LoanWithDetails[] = (loansData || []).map((loan: any) => {
        // Ambil borrower lengkap dari borrowerId
        const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? {} : {}

        // Ambil itemDetails lengkap dari loan.items
        let itemDetails: any[] = []
        if (Array.isArray(loan.items)) {
          itemDetails = loan.items.map((item: any) => {
            const base = itemMap[item.itemId?.toString()] ?? {}
            return {
              ...base,
              quantity: item.quantity ?? 1,
              serialNumber: item.serialNumber,
            }
          })
        }

        return {
          ...loan,
          borrower,
          itemDetails,
        }
      })

      // Calculate active borrowers
      const unique = new Set<string>()
      mapped.forEach((loan) => {
        if (loan.status === "dipinjam" && loan.borrower?.id) {
          unique.add(loan.borrower.id.toString())
        }
      })
      setActiveBorrowers(unique.size)

      // Sort by createdAt descending (newest first)
      const sortedLoans = [...mapped].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  setRecentLoans(sortedLoans.slice(0, 5))
  setAllLoans(sortedLoans)
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
      href: "/barang",
    },
    {
      title: "Peminjam Aktif",
      value: activeBorrowers, // gunakan hasil hitung manual, bukan dari stats
      icon: Users,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-600/30",
      iconColor: "text-green-200",
      textColor: "text-green-100",
      href: "/peminjam",
    },
    {
      title: "Sedang Dipinjam",
      value: stats?.activeLoan || 0,
      icon: Clock,
      gradient: "from-yellow-500 to-yellow-600",
      iconBg: "bg-yellow-600/30",
      iconColor: "text-yellow-200",
      textColor: "text-yellow-100",
      href: "/pengembalian",
    },
    {
      title: "Terlambat",
      value: stats?.overdueLoan || 0,
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
      iconBg: "bg-red-600/30",
      iconColor: "text-red-200",
      textColor: "text-red-100",
      href: "/pengembalian",
    },
  ]

  // --- Chart Data Processing ---
  // 1. Bar chart: loans per hour per weekday
  const weekdayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
  const hourLabels = Array.from({ length: 24 }, (_, i) => i)
  // Build: [{ hour: 0, Senin: 2, Selasa: 1, ... }, ...]
  const loansByHourWeekday: any[] = hourLabels.map((hour) => {
    const row: any = { hour }
    weekdayNames.forEach((wd) => (row[wd] = 0))
    return row
  })
  allLoans.forEach((loan) => {
    const d = new Date(loan.createdAt)
    const hour = d.getHours()
    const dayIdx = d.getDay()
    // getDay: 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    if (dayIdx >= 1 && dayIdx <= 5) {
      const wd = weekdayNames[dayIdx - 1]
      const row = loansByHourWeekday.find((r) => r.hour === hour)
      if (row && wd) row[wd]++
    }
  })

  // 2. Line chart: loans per date
  // Build: [{ date: '2025-08-01', count: 3 }, ...]
  const loansByDateMap = new Map<string, number>()
  allLoans.forEach((loan) => {
    const d = new Date(loan.createdAt)
    const dateStr = d.toISOString().slice(0, 10)
    loansByDateMap.set(dateStr, (loansByDateMap.get(dateStr) || 0) + 1)
  })
  const loansByDate = Array.from(loansByDateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, Peminjaman: count }))

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
            <button
              key={stat.title}
              type="button"
              onClick={() => router.push(stat.href)}
              className={`group bg-gradient-to-r ${stat.gradient} text-white border-0 shadow-md rounded-lg focus:outline-none transition-transform hover:scale-[1.01]`}
              style={{ cursor: 'pointer' }}
            >
              <CardContent className="flex items-center justify-between py-5">
                <div className="text-left">
                  <div className={`${stat.textColor} text-xs font-medium`}>{stat.title}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </div>
                <div className={`rounded-full ${stat.iconBg} p-2`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </CardContent>
            </button>
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
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        {loan.itemDetails && loan.itemDetails.length > 0 ? (
                          loan.itemDetails.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                {(() => {
                                  const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                                  return <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
                                })()}
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
      {/* Statistik Peminjaman Charts - bawah list, 2 kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl transition-all duration-200" style={{ fontFamily: 'inherit' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribusi Jam Peminjaman per Hari</CardTitle>
            <CardDescription className="text-xs">Jumlah peminjaman pada setiap jam, dipisah per hari (1 peminjaman dihitung 1)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loansByHourWeekday} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barCategoryGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'var(--tw-text-gray-500)' }} />
                  <YAxis allowDecimals={false} tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'var(--tw-text-gray-500)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--tw-bg-white, #fff)', color: 'var(--tw-text-gray-900, #111)', borderRadius: 12, border: '1px solid #e5e7eb', fontFamily: 'inherit', fontSize: 13, boxShadow: '0 2px 8px #0001', padding: 10 }}
                    itemStyle={{ fontFamily: 'inherit', fontSize: 13, color: 'var(--tw-text-gray-900, #111)' }}
                    labelStyle={{ fontWeight: 600, fontFamily: 'inherit', fontSize: 13, color: 'var(--tw-text-gray-900, #111)' }}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'inherit', fontSize: 13, paddingBottom: 4 }} iconType="circle" />
                  {weekdayNames.map((wd, i) => (
                    <Bar key={wd} dataKey={wd} stackId="a" fill={`hsl(${i * 50},70%,60%)`} radius={[6, 6, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {/* Line Chart: Jumlah Peminjaman per Tanggal */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl transition-all duration-200" style={{ fontFamily: 'inherit' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Jumlah Peminjaman per Tanggal</CardTitle>
            <CardDescription className="text-xs">Setiap peminjaman dihitung 1</CardDescription>
          </CardHeader>
            <CardContent className="pt-0">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loansByDate} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} minTickGap={8} tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'var(--tw-text-gray-500)' }} />
                <YAxis allowDecimals={false} tick={{ fontFamily: 'inherit', fontSize: 12, fill: 'var(--tw-text-gray-500)' }} />
                <Tooltip
                contentStyle={{ background: 'var(--tw-bg-white, #fff)', color: 'var(--tw-text-gray-900, #111)', borderRadius: 12, border: '1px solid #e5e7eb', fontFamily: 'inherit', fontSize: 13, boxShadow: '0 2px 8px #0001', padding: 10 }}
                itemStyle={{ fontFamily: 'inherit', fontSize: 13, color: 'var(--tw-text-gray-900, #111)' }}
                labelStyle={{ fontWeight: 600, fontFamily: 'inherit', fontSize: 13, color: 'var(--tw-text-gray-900, #111)' }}
                wrapperStyle={{ zIndex: 50 }}
                />
                <Legend wrapperStyle={{ fontFamily: 'inherit', fontSize: 13, paddingBottom: 4 }} iconType="circle" />
                <Line type="monotone" dataKey="Peminjaman" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4, style: { transition: 'all 0.2s' } }} />
              </LineChart>
              </ResponsiveContainer>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
