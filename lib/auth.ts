"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  isAuthenticated: boolean
  user: { login: string; nome: string; role: string } | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username: string, password: string) => {
        // Autenticação simples conforme solicitado
        if (username === "luvasdoisirmaos" && password === "admin123") {
          set({
            isAuthenticated: true,
            user: { login: username, nome: "Administrador", role: "admin" },
          })
          return true
        }
        if (username === "victorluvas" && password === "admin123") {
          set({
            isAuthenticated: true,
            user: { login: username, nome: "Victor Luvas", role: "victor" },
          })
          return true
        }
        return false
      },
      logout: () => {
        set({ isAuthenticated: false, user: null })
      },
    }),
    {
      name: "luvas-auth-storage",
    },
  ),
)
