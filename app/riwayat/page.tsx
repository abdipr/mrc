"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Package,
  Filter,
  Laptop,
  Cable,
  Projector,
  Mouse,
  Tablet,
  Printer,
  Monitor,
  Keyboard,
  Speaker,
  HdmiPort,
  Plug,
  Presentation,
  MicVocal,
  Printer as PrinterIcon,
} from "lucide-react";

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
import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { auth } from "@/lib/auth";
import api from "@/lib/api";
import type { LoanWithDetails } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  isOverdue,
  getDaysUntilDue,
} from "@/lib/utils";

const PAGE_SIZE = 20;

export default function RiwayatPage() {
  // Gabungkan semua data ke satu array: loansWithDetails
  const [loansWithDetails, setLoansWithDetails] = useState<LoanWithDetails[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // terbaru default
  const [page, setPage] = useState(1);
  const [detailLoan, setDetailLoan] = useState<LoanWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadLoans();
  }, [router]);

  useEffect(() => {
    filterLoans();
  }, [loansWithDetails, search, statusFilter, monthFilter, yearFilter, sortOrder]);

  const loadLoans = async () => {
    try {
      setIsLoading(true);
      // Fetch all loans, items, and borrowers
      const [loansData, items, borrowers] = await Promise.all([
        api.getLoans(),
        api.getItems(),
        api.getBorrowers(),
      ]);

      // Index borrowers and items by id for fast lookup
      const borrowerMap = Object.fromEntries(
        (borrowers || []).map((b: any) => [b.id?.toString(), b])
      );
      const itemMap = Object.fromEntries(
        (items || []).map((item: any) => [item.id?.toString(), item])
      );

      // Gabungkan semua data ke satu array
      const mapped: LoanWithDetails[] = (loansData || []).map((loan: any) => {
        // Ambil borrower lengkap dari borrowerId
        const borrower = loan.borrowerId ? borrowerMap[loan.borrowerId?.toString()] ?? {} : {};

        // Ambil itemDetails lengkap dari loan.items
        let itemDetails: any[] = [];
        if (Array.isArray(loan.items)) {
          itemDetails = loan.items.map((item: any) => {
            const base = itemMap[item.itemId?.toString()] ?? {};
            return {
              ...base,
              quantity: item.quantity ?? 1,
              serialNumber: item.serialNumber,
            };
          });
        }

        return {
          ...loan,
          borrower,
          itemDetails,
        };
      });
      setLoansWithDetails(mapped);
    } catch (err) {
      // Optionally handle error
    } finally {
      setIsLoading(false);
    }
  };

  const filterLoans = () => {
    let filtered = loansWithDetails;
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((loan) => {
        const borrowerName = typeof loan.borrower?.name === "string" ? loan.borrower.name.toLowerCase() : "";
        const borrowerNIP = typeof loan.borrower?.nip === "string" ? loan.borrower.nip.toLowerCase() : "";
        const borrowerOfficerId = typeof loan.borrower?.officerId === "string" ? loan.borrower.officerId.toLowerCase() : "";
        const itemMatch = loan.itemDetails?.some((item) =>
          typeof item.name === "string" ? item.name.toLowerCase().includes(q) : false
        );
        return (
          borrowerName.includes(q) ||
          itemMatch ||
          borrowerNIP.includes(q) ||
          borrowerOfficerId.includes(q)
        );
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }
    // Filter by month and year
    if (monthFilter !== "all" || yearFilter !== "all") {
      filtered = filtered.filter((loan) => {
        const date = new Date(loan.borrowDate);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString();
        const monthMatch = monthFilter === "all" || month === monthFilter;
        const yearMatch = yearFilter === "all" || year === yearFilter;
        return monthMatch && yearMatch;
      });
    }
    // Sort by createdAt
    filtered = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
    });
    setFilteredLoans(filtered);
    setPage(1); // Reset ke halaman 1 jika filter berubah
  };

  // Pagination
  const totalPages = Math.ceil(filteredLoans.length / PAGE_SIZE);
  const paginatedLoans = filteredLoans.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const getStatusBadge = (loan: LoanWithDetails) => {
    if (loan.status === "dikembalikan") {
      return (
        <span className="badge-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Dikembalikan
        </span>
      );
    }
    if (isOverdue(loan.dueDate) && loan.status === "dipinjam") {
      const overdueDays = Math.abs(getDaysUntilDue(loan.dueDate));
      return (
        <span className="badge-danger">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Terlambat {overdueDays} hari
        </span>
      );
    }
    if (loan.status === "dipinjam") {
      const daysLeft = getDaysUntilDue(loan.dueDate);
      if (daysLeft <= 3) {
        return (
          <span className="badge-warning">
            <Clock className="w-3 h-3 mr-1" />
            {daysLeft === 0 ? "Jatuh tempo hari ini" : `${daysLeft} hari lagi`}
          </span>
        );
      }
      return (
        <span className="badge-info">
          <Clock className="w-3 h-3 mr-1" />
          Dipinjam
        </span>
      );
    }
    return null;
  };


  if (!auth.isAuthenticated()) return null;

  // Jangan render tabel sebelum mapping selesai
  if (isLoading || loansWithDetails.length === 0) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-[90rem] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Loading />
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Riwayat Peminjaman
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lihat seluruh riwayat peminjaman barang
            </p>
          </div>
          <Button
            onClick={() => {
              const params = new URLSearchParams({
                search,
                status: statusFilter,
                month: monthFilter,
                year: yearFilter,
                sort: sortOrder,
              });
              window.open(`/print?${params.toString()}`, '_blank');
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
          >
            <PrinterIcon className="w-5 h-5" />
            Print
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari peminjam atau barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Bulan */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                <SelectItem value="01">Januari</SelectItem>
                <SelectItem value="02">Februari</SelectItem>
                <SelectItem value="03">Maret</SelectItem>
                <SelectItem value="04">April</SelectItem>
                <SelectItem value="05">Mei</SelectItem>
                <SelectItem value="06">Juni</SelectItem>
                <SelectItem value="07">Juli</SelectItem>
                <SelectItem value="08">Agustus</SelectItem>
                <SelectItem value="09">September</SelectItem>
                <SelectItem value="10">Oktober</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">Desember</SelectItem>
              </SelectContent>
            </Select>

            {/* Tahun */}
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {/* Generate unique years from loansWithDetails */}
                {Array.from(new Set(loansWithDetails.map(l => new Date(l.borrowDate).getFullYear()))).sort((a, b) => b - a).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="dipinjam">Dipinjam</SelectItem>
                <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
                <SelectItem value="terlambat">Terlambat</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order Filter */}
            <Select
              value={sortOrder}
              onValueChange={(v) => setSortOrder(v as "desc" | "asc")}
            >
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Terbaru</SelectItem>
                <SelectItem value="asc">Terlama</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center">
              <Button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setMonthFilter("all");
                  setYearFilter("all");
                  setSortOrder("desc");
                }}
                className="w-max flex items-center text-sm font-medium text-gray-600 border-gray-600 border dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg transition-colors"
                variant={"outline"}
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Loans Table - shadcn/ui Table */}
        <div className="card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peminjam</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead>Tanggal Pinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {search || statusFilter
                        ? "Tidak ada data yang sesuai dengan filter"
                        : "Belum ada riwayat peminjaman"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLoans.map((loan) => (
                    <TableRow
                    key={loan.id}
                    className={`hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors ${
                      isOverdue(loan.dueDate) && loan.status === "dipinjam"
                      ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-800/20"
                      : ""
                    } cursor-pointer`}
                    onClick={() => {
                      setDetailLoan(loan);
                      setIsDetailOpen(true);
                    }}
                    >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-base font-semibold">
                        {loan.borrower?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                        {loan.borrower?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                        {loan.borrower?.nip && loan.borrower?.officerId
                          ? `${loan.borrower.nip} - ${loan.borrower.officerId}`
                          : loan.borrower?.nip
                          ? loan.borrower.nip
                          : loan.borrower?.officerId
                          ? loan.borrower.officerId
                          : null}
                        </div>
                      </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                      {loan.itemDetails && loan.itemDetails.length > 0 ? (
                        loan.itemDetails.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          {(() => {
                            const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                            return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
                          })()}
                          </div>
                          <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">
                            {item.quantity}
                            </span>
                            x
                          </div>
                          </div>
                        </div>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDate(loan.borrowDate)}
                    </TableCell>
                    <TableCell
                      className={`font-medium ${
                        isOverdue(loan.dueDate) && loan.status !== "dikembalikan"
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {formatDate(loan.dueDate)}
                    </TableCell>
                    <TableCell>{getStatusBadge(loan)}</TableCell>
                    </TableRow>
                ))
              )}
              {/* Detail Dialog */}
              <AlertDialog
                open={isDetailOpen}
                onOpenChange={(open) => {
                  setIsDetailOpen(open);
                  if (!open) setDetailLoan(null);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Detail Peminjaman</AlertDialogTitle>
                    <AlertDialogDescription>
                      {detailLoan ? (
                        <div className="space-y-6">
                          {/* Borrower Card */}
                          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 border border-accent-200 dark:border-accent-700 shadow-sm">
                            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-accent-500 flex items-center justify-center text-white text-2xl font-bold">
                              <User className="w-8 h-8" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <div className="text-md font-semibold text-gray-900 dark:text-white">
                                  {detailLoan.borrower?.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  NIP: {detailLoan.borrower?.nip}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID Pegawai: {detailLoan.borrower?.officerId}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  No. HP: {detailLoan.borrower?.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Loan Info Card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                                <span className="font-semibold">
                                  Tanggal Pinjam
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                {formatDateTime(detailLoan.borrowDate)}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                <span className="font-semibold">
                                  Jatuh Tempo
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                {formatDateTime(detailLoan.dueDate)}
                              </div>
                              {detailLoan.returnDate && (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold">
                                      Tanggal Kembali
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                                    {formatDateTime(detailLoan.returnDate)}
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Status:</span>
                                {getStatusBadge(detailLoan)}
                              </div>
                              <div>
                                <span className="font-semibold">
                                  Keperluan:
                                </span>{" "}
                                {detailLoan.purpose || "-"}
                              </div>
                              <div>
                                <span className="font-semibold">Catatan:</span>{" "}
                                {detailLoan.notes || "-"}
                              </div>
                            </div>
                          </div>
                          {/* Items Card */}
                          <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                            <div className="font-semibold mb-2">
                              Daftar Barang
                            </div>
                            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                              {detailLoan.itemDetails && detailLoan.itemDetails.length > 0 ? (
                                detailLoan.itemDetails.map((item, idx) => (
                                  <li
                                    key={item.id}
                                    className="flex items-center gap-3 py-2"
                                  >
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30">
                                      {(() => {
                                        const Icon = ICON_OPTIONS.find(opt => opt.value === (item.icon || "laptop"))?.icon || Laptop;
                                        return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
                                      })()}
                                    </span>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {item.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Jumlah: {" "}
                                        <span className="font-semibold">
                                          {item.quantity}
                                        </span>
                                        {item.serialNumber
                                          ? ` | Nomor Seri: ${item.serialNumber}`
                                          : ""}
                                      </div>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-400 text-sm py-2">Tidak ada barang</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setIsDetailOpen(false);
                        setDetailLoan(null);
                      }}
                      className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
                    >
                      Tutup
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === i + 1}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
