const API_BASE_URL = "http://192.168.1.10/api"

// Simulate API calls with localStorage for demo
class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      // Fallback to localStorage for demo
      console.warn("API not available, using localStorage:", error)
      return this.fallbackToLocalStorage(endpoint, options)
    }
  }

  private fallbackToLocalStorage<T>(endpoint: string, options?: RequestInit): T {
    const method = options?.method || "GET"
    // Always use the base key for borrowers/items/loans
    let key = ""
    if (endpoint.startsWith("/borrowers")) key = "_borrowers"
    else if (endpoint.startsWith("/items")) key = "_items"
    else if (endpoint.startsWith("/loans")) key = "_loans"
    else key = endpoint.replace("/", "_")

    switch (method) {
      case "GET": {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : []
      }
      case "POST": {
        const newData = JSON.parse(options?.body as string)
        newData.id = Date.now().toString()
        newData.createdAt = new Date().toISOString()
        newData.updatedAt = new Date().toISOString()

        const existing = localStorage.getItem(key)
        const existingData = existing ? JSON.parse(existing) : []
        existingData.push(newData)
        localStorage.setItem(key, JSON.stringify(existingData))
        return newData
      }
      case "PUT": {
        const updateData = JSON.parse(options?.body as string)
        const id = endpoint.split("/").pop()
        const existingPut = localStorage.getItem(key)
        const existingDataPut = existingPut ? JSON.parse(existingPut) : []
        const index = existingDataPut.findIndex((item: any) => item.id === id)
        if (index !== -1) {
          existingDataPut[index] = { ...existingDataPut[index], ...updateData, updatedAt: new Date().toISOString() }
          localStorage.setItem(key, JSON.stringify(existingDataPut))
        }
        return existingDataPut[index]
      }
      case "DELETE": {
        const deleteId = endpoint.split("/").pop()
        const existingDelete = localStorage.getItem(key)
        const existingDataDelete = existingDelete ? JSON.parse(existingDelete) : []
        const filteredData = existingDataDelete.filter((item: any) => item.id !== deleteId)
        localStorage.setItem(key, JSON.stringify(filteredData))
        return { success: true } as T
      }
      default:
        return [] as T
    }
  }

  // Items API
  async getItems(): Promise<any[]> {
    return this.request<any[]>("/items")
  }

  async createItem(item: any): Promise<any> {
    return this.request<any>("/items", {
      method: "POST",
      body: JSON.stringify(item),
    })
  }

  async updateItem(id: string, item: any): Promise<any> {
    return this.request<any>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    })
  }

  async deleteItem(id: string): Promise<void> {
    await this.request(`/items/${id}`, { method: "DELETE" })
  }

  // Borrowers API
  async getBorrowers(): Promise<any[]> {
    return this.request<any[]>("/borrowers")
  }

  async createBorrower(borrower: any): Promise<any> {
    return this.request<any>("/borrowers", {
      method: "POST",
      body: JSON.stringify(borrower),
    })
  }

  async updateBorrower(id: string, borrower: any): Promise<any> {
    return this.request<any>(`/borrowers/${id}`, {
      method: "PUT",
      body: JSON.stringify(borrower),
    })
  }

  async deleteBorrower(id: string): Promise<void> {
    await this.request(`/borrowers/${id}`, { method: "DELETE" })
  }

  // Loans API
  async getLoans(): Promise<any[]> {
    const loans = await this.request<any[]>("/loans")
    const items = await this.getItems()
    const borrowers = await this.getBorrowers()

    return loans.map((loan) => ({
      ...loan,
      borrower: borrowers.find((borrower) => borrower.id === loan.borrowerId)!,
      itemDetails:
        loan.items?.map((loanItem: any) => ({
          ...items.find((item) => item.id === loanItem.itemId)!,
          quantity: loanItem.quantity,
          serialNumber: loanItem.serialNumber,
        })) || [],
      // Legacy support for old single item loans
      item: loan.itemId ? items.find((item) => item.id === loan.itemId) : null,
    }))
  }

  async createLoan(loan: any): Promise<any> {
    return this.request<any>("/loans", {
      method: "POST",
      body: JSON.stringify(loan),
    })
  }

  async updateLoan(id: string, loan: any): Promise<any> {
    return this.request<any>(`/loans/${id}`, {
      method: "PUT",
      body: JSON.stringify(loan),
    })
  }

  async returnLoan(id: string): Promise<any> {
    return this.updateLoan(id, {
      status: "dikembalikan",
      returnDate: new Date().toISOString(),
    })
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const items = await this.getItems()
    const borrowers = await this.getBorrowers()
    const loans = await this.getLoans()

    const activeLoan = loans.filter((loan) => loan.status === "dipinjam").length
    const overdueLoan = loans.filter((loan) => loan.status === "dipinjam" && new Date(loan.dueDate) < new Date()).length

    return {
      totalItems: items.length,
      totalBorrowers: borrowers.length,
      activeLoan,
      overdueLoan,
    }
  }
}

export const api = new ApiService()
