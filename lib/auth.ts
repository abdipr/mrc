export interface User {
  id: string
  username: string
  name: string
  email: string
  role: "admin" | "user"
}

class AuthService {
  private readonly STORAGE_KEY = "school_borrowing_user"

  login(username: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      // Dummy authentication
      if (username === "admin" && password === "admin123") {
        const user: User = {
          id: "1",
          username: "admin",
          name: "Administrator",
          email: "admin@sekolah.com",
          role: "admin",
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
        }
        resolve(user)
      } else {
        reject(new Error("Username atau password salah"))
      }
    })
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
