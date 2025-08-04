export interface Item {
  id: string
  name: string
  category: string
  stock: number
  condition: "Baik" | "Rusak" | "Hilang"
  location: string
  description?: string
  createdAt: string
  updatedAt: string
  icon?: string
}

export interface Borrower {
  id: string
  name: string
  nip: string
  teacherId: string
  phone: string
  createdAt: string
  updatedAt: string
}

export interface LoanItem {
  itemId: string
  quantity: number
  serialNumber?: string
}

export interface Loan {
  id: string
  borrowerId: string
  items: LoanItem[]
  borrowDate: string
  returnDate?: string
  dueDate: string
  status: "dipinjam" | "dikembalikan" | "terlambat"
  purpose?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LoanWithDetails extends Loan {
  borrower: Borrower
  itemDetails: (Item & { quantity: number; serialNumber?: string })[]
}

export interface DashboardStats {
  totalItems: number
  totalBorrowers: number
  activeLoan: number
  overdueLoan: number
}
