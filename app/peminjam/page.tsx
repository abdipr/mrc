"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Users, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import Loading from "@/components/ui/loading"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"
import type { Borrower } from "@/lib/types"
import { formatDate } from "@/lib/utils"

export default function PeminjamPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [filteredBorrowers, setFilteredBorrowers] = useState<Borrower[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Notif pakai sonner
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingBorrower, setEditingBorrower] = useState<Borrower | null>(null)
  const [deletingBorrower, setDeletingBorrower] = useState<Borrower | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    teacherId: "",
    phone: "",
  })

  const router = useRouter()

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }
    loadBorrowers()
  }, [router])

  useEffect(() => {
    filterBorrowers()
  }, [borrowers, search])

  const loadBorrowers = async () => {
    try {
      setIsLoading(true)
      // Ambil data guru (bukan siswa)
      const data = await api.getBorrowers()
      // Pastikan hanya field yang relevan
      setBorrowers(data.map((b: any) => ({
        id: b.id,
        name: b.name,
        nip: b.nip,
        teacherId: b.teacherId,
        phone: b.phone || "",
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })))
    } catch (err) {
      setError("Gagal memuat data peminjam")
    } finally {
      setIsLoading(false)
    }
  }

  const filterBorrowers = () => {
    let filtered = borrowers
    if (search) {
      filtered = filtered.filter(
        (borrower) =>
          borrower.name.toLowerCase().includes(search.toLowerCase()) ||
          (borrower.nip && borrower.nip.toLowerCase().includes(search.toLowerCase())) ||
          (borrower.teacherId && borrower.teacherId.toLowerCase().includes(search.toLowerCase())) ||
          (borrower.phone && borrower.phone.toLowerCase().includes(search.toLowerCase()))
      )
    }
    setFilteredBorrowers(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError("")
      setSuccess("")

      if (editingBorrower) {
        await api.updateBorrower(editingBorrower.id, formData)
        toast.success("Data guru berhasil diperbarui", {
          duration: 6000,
          className: "toast-success"
        })
      } else {
        await api.createBorrower(formData)
        toast.success("Guru berhasil ditambahkan", {
          duration: 6000,
          className: "toast-success"
        })
      }

      setIsDialogOpen(false)
      setEditingBorrower(null)
      resetForm()
      setTimeout(() => {
        loadBorrowers()
      }, 300)
    } catch (err: any) {
      toast.error("Gagal menyimpan data guru: " + (err?.message || JSON.stringify(err)), {
        duration: 6000,
        className: "toast-error"
      })
    }
  }

  const handleEdit = (borrower: Borrower) => {
    setEditingBorrower(borrower)
    setFormData({
      name: borrower.name,
      nip: borrower.nip,
      teacherId: borrower.teacherId,
      phone: borrower.phone || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBorrower) return

    try {
      await api.deleteBorrower(deletingBorrower.id)
      toast.success("Peminjam berhasil dihapus", {
        duration: 6000,
        className: "toast-success"
      })
      setDeletingBorrower(null)
      setIsDeleteDialogOpen(false)
      setTimeout(() => {
        loadBorrowers()
      }, 300)
    } catch (err: any) {
      toast.error("Gagal menghapus peminjam: " + (err?.message || JSON.stringify(err)), {
        duration: 6000,
        className: "toast-error"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      nip: "",
      teacherId: "",
      phone: "",
    })
  }

  const openAddDialog = () => {
    setEditingBorrower(null)
    resetForm()
    setIsDialogOpen(true)
  }

  if (!auth.isAuthenticated()) return null

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Peminjam</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola data siswa dan staff yang dapat meminjam barang</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingBorrower(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <button onClick={openAddDialog} className="btn-outline">
                <Plus className="w-5 h-5 mr-2" />
                Tambah Peminjam
              </button>
            </DialogTrigger>
            <DialogContent
              className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-xl shadow-md"
              aria-describedby="peminjam-dialog-desc"
            >
              <DialogHeader>
                <DialogTitle>{editingBorrower ? "Edit Peminjam" : "Tambah Peminjam Baru"}</DialogTitle>
                <p id="peminjam-dialog-desc" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingBorrower ? "Perbarui data peminjam di bawah ini." : "Isi data peminjam di bawah ini untuk menambah peminjam baru."}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap *</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="Arif Rahman Hakim"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">NIP *</label>
                    <Input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      className="input-field"
                      placeholder="1999xxxxxxxxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID Guru *</label>
                    <Input
                      type="text"
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="input-field"
                      placeholder="12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No. HP *</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingBorrower(null)
                        resetForm()
                      }}
                      className="px-5 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
                    >
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="px-5 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-400 transition-colors shadow-sm"
                  >
                    {editingBorrower ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {/* Search */}
        <div className="p-6 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Cari peminjam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 h-9 text-sm"
            />
          </div>
        </div>

        {/* Borrowers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBorrowers.length === 0 ? (
            <div className="col-span-full">
              <div className="card p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {search ? "Tidak ada peminjam yang sesuai dengan pencarian" : "Belum ada data peminjam"}
                </p>
              </div>
            </div>
          ) : (
            filteredBorrowers.map((borrower) => (
              <div key={borrower.id} className="card-hover p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">{borrower.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{borrower.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{borrower.nip}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(borrower)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingBorrower(borrower)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    NIP: {borrower.nip}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    ID Guru: {borrower.teacherId}
                  </div>
                  {borrower.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-2" />
                      {borrower.phone}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Terdaftar: {formatDate(borrower.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dialog sudah dipindahkan ke header agar konsisten dengan barang */}

      {/* Delete Confirmation with AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setDeletingBorrower(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peminjam</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data peminjam "{deletingBorrower?.name}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingBorrower(null)
              }}
              className="rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              autoFocus
              className=" rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 transition-colors shadow-sm"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
