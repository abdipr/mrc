export interface User {
  id: string
  username: string
  name: string
}

class AuthService {
  private readonly STORAGE_KEY = "school_borrowing_user"

  async login(username: string, password: string): Promise<User> {
    // Fetch admin credentials from /api/settings
    const res = await fetch("/api/settings")
    if (!res.ok) throw new Error("Gagal mengambil data admin")
    const settings = await res.json()
    const admin = settings.admin
    if (username === admin.username && password === admin.password) {
      const user: User = {
        id: "1",
        username: admin.username,
        name: settings.siteName,
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
      }
      return user
    } else {
      throw new Error("Username atau password salah")
    }
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}

export const auth = new AuthService()
