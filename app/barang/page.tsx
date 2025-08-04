"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2, Package, Filter } from "lucide-react"
// Icon components mapping (lucide-react)
import {
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
} from "lucide-react"
import Loading from "@/components/ui/loading"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption } from "@/components/ui/table"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"
import type { Item } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import "@/app/globals.css"


export default function BarangPage() {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
// Remove local error/success state, use toast instead
const [search, setSearch] = useState("")
const [categoryFilter, setCategoryFilter] = useState("all")
const [conditionFilter, setConditionFilter] = useState("all")

// Icon options for devices
const ICON_OPTIONS = [
  { label: "Laptop", value: "laptop" },
  { label: "Cable", value: "cable" },
  { label: "Projector", value: "projector" },
  { label: "HDMI", value: "hdmi" },
  { label: "Plug", value: "plug"},
  { label: "Mouse", value: "mouse" },
  { label: "Tablet", value: "tablet" },
  { label: "Printer", value: "printer" },
  { label: "Monitor", value: "monitor" },
  { label: "Keyboard", value: "keyboard" },
  { label: "Speaker", value: "speaker" },
  { label: "Presentation", value: "presentation" },
  { label: "Mic", value: "mic" },
  { label: "Lainnya", value: "other"},
]

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  laptop: <Laptop className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  cable: <Cable className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  projector: <Projector className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  hdmi: <HdmiPort className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  plug: <Plug className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  mouse: <Mouse className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  tablet: <Tablet className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  printer: <Printer className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  monitor: <Monitor className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  keyboard: <Keyboard className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  speaker: <Speaker className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  presentation: <Presentation className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  mic: <MicVocal className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
  other: <Package className="w-6 h-6 text-accent-600 dark:text-accent-400" />,
}

  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [deletingItem, setDeletingItem] = useState<Item | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    condition: "Baik" as "Baik" | "Rusak" | "Hilang",
    location: "",
    description: "",
    icon: "laptop", // default icon
  })

  const router = useRouter()

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login")
      return
    }
    loadItems()
  }, [router])

  useEffect(() => {
    filterItems()
  }, [items, search, categoryFilter, conditionFilter])

  const loadItems = async () => {
    try {
      setIsLoading(true)
      const data = await api.getItems()
      setItems(data)
    } catch (err) {
      toast.error("Gagal memuat data barang", { className: "toast-error", duration: 6000 })
    } finally {
      setIsLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = items

    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase()) ||
          item.location.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    if (conditionFilter !== "all") {
      filtered = filtered.filter((item) => item.condition === conditionFilter)
    }

    setFilteredItems(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api.updateItem(editingItem.id, formData)
        toast.success("Barang berhasil diperbarui", { className: "toast-success", duration: 6000 })
      } else {
        await api.createItem(formData)
        toast.success("Barang berhasil ditambahkan", { className: "toast-success", duration: 6000 })
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      resetForm()
      loadItems()
    } catch (err) {
      toast.error("Gagal menyimpan data barang", { className: "toast-error", duration: 6000 })
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      condition: item.condition,
      location: item.location,
      description: item.description || "",
      icon: item.icon || "laptop",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    try {
      await api.deleteItem(deletingItem.id)
      toast.success("Barang berhasil dihapus", { className: "toast-success", duration: 6000 })
      loadItems()
    } catch (err) {
      toast.error("Gagal menghapus barang", { className: "toast-error", duration: 6000 })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      stock: 0,
      condition: "Baik",
      location: "",
      description: "",
      icon: "laptop",
    })
  }

  const openAddDialog = () => {
    setEditingItem(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const categories = [...new Set(items.map((item) => item.category))].filter(Boolean)

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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Barang</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola data barang yang tersedia untuk dipinjam</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button onClick={openAddDialog} className="btn-outline">
                <Plus className="w-5 h-5 mr-2" />
                Tambah Barang
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-full bg-gray-50 dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Barang *</Label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon Barang *</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(val) => setFormData({ ...formData, icon: val })}
                      required
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue placeholder="Pilih icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2">
                              {ICON_COMPONENTS[opt.value]}
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori *</Label>
                    <Input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stok *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kondisi *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(val) => setFormData({ ...formData, condition: val as "Baik" | "Rusak" | "Hilang" })}
                      required
                    >
                      <SelectTrigger className="input-field">
                        <SelectValue placeholder="Pilih kondisi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baik">Baik</SelectItem>
                        <SelectItem value="Rusak">Rusak</SelectItem>
                        <SelectItem value="Hilang">Hilang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>



                <div className="md:col-span-2">
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="input-field"
                      placeholder="Deskripsi tambahan (opsional)"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <DialogClose asChild>
                    <Button
                      onClick={() => {
                        setIsDialogOpen(false)
                        setEditingItem(null)
                        resetForm()
                      }}
                      className="px-5 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
                    >
                      Batal
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="px-5 py-2 rounded-lg font-medium bg-accent-600 text-white hover:bg-accent-700 focus:ring-2 focus:ring-accent-400 transition-colors shadow-sm">
                    {editingItem ? "Perbarui" : "Tambahkan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts replaced by toast notifications */}

        {/* Filters */}
        <div className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 "
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Semua Kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kondisi</SelectItem>
                <SelectItem value="Baik">Baik</SelectItem>
                <SelectItem value="Rusak">Rusak</SelectItem>
                <SelectItem value="Hilang">Hilang</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setSearch("")
                setCategoryFilter("all")
                setConditionFilter("all")
              }}
              className="w-max flex items-center text-sm font-medium text-gray-600 border-gray-600 border dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg transition-colors"
              variant={"outline"}
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          </div>
        </div>

        {/* Items Table - shadcn/ui Table */}
        <div className="card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="rounded-tl-lg w-12">Icon</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead>Terakhir Update</TableHead>
                <TableHead className="rounded-tr-lg">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 rounded-b-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {search || categoryFilter || conditionFilter
                        ? "Tidak ada barang yang sesuai dengan filter"
                        : "Belum ada data barang"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, idx) => {
                  const isLast = idx === filteredItems.length - 1
                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isLast ? 'last-row' : ''}`}
                    >
                      <TableCell className={isLast ? "rounded-bl-lg" : undefined}>
                        {ICON_COMPONENTS[item.icon || "laptop"] || <Laptop className="w-6 h-6 text-accent-600 dark:text-accent-400" />}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            item.stock === 0
                              ? "text-red-600 dark:text-red-400"
                              : item.stock < 5
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`badge ${
                            item.condition === "Baik"
                              ? "badge-success"
                              : item.condition === "Rusak"
                                ? "badge-warning"
                                : "badge-danger"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </TableCell>
                      {/* <TableCell className="text-gray-600 dark:text-gray-400">{item.location}</TableCell> */}
                      <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(item.updatedAt)}</TableCell>
                      <TableCell className={isLast ? "rounded-br-lg" : undefined}>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setDeletingItem(item)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      {/* Delete Confirmation - shadcn/ui AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setDeletingItem(null)
      }}>
        <AlertDialogContent className="max-w-md w-full bg-gray-50 dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus barang <span className="font-semibold">"{deletingItem?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <AlertDialogCancel asChild>
              <Button
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeletingItem(null)
                }}
                className="px-5 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-colors"
              >
                Batal
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                autoFocus
                onClick={async () => {
                  await handleDelete()
                  setIsDeleteDialogOpen(false)
                  setDeletingItem(null)
                }}
                className="px-5 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 transition-colors shadow-sm"
              >
                Hapus
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
