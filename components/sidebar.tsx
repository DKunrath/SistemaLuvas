"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  UserCog,
  Warehouse,
  Boxes,
  Scissors,
  Shirt,
  DollarSign,
  ShoppingCart,
  Calculator,
  FileText,
  LogOut,
  Menu,
  X,
  MapPin,
} from "lucide-react"
import { useState } from "react"

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/dashboard/clientes", icon: Users },
  { name: "Produtos", href: "/dashboard/produtos", icon: Package },
  { name: "Pedidos", href: "/dashboard/pedidos", icon: ClipboardList },
  { name: "Funcionários", href: "/dashboard/funcionarios", icon: UserCog },
  { name: "Estoque Produtos", href: "/dashboard/estoque-produtos", icon: Warehouse },
  { name: "Rastreamento Produção", href: "/dashboard/rastreamento-producao", icon: MapPin },
  { name: "Estoque Insumos", href: "/dashboard/estoque-insumos", icon: Boxes },
  { name: "Corte", href: "/dashboard/corte", icon: Scissors },
  { name: "Costura", href: "/dashboard/costura", icon: Shirt },
  { name: "Controle de Couro", href: "/dashboard/couro", icon: ShoppingCart },
  { name: "Victor Luvas", href: "/dashboard/victor-luvas", icon: FileText },
  { name: "Custo de Produção", href: "/dashboard/custo-producao", icon: Calculator },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  // Filtrar itens do menu baseado no perfil do usuário
  const getFilteredMenuItems = () => {
    if (user?.role === "victor") {
      // Usuário victorluvas vê apenas Victor Luvas
      return menuItems.filter(item => item.href === "/dashboard/victor-luvas")
    }
    // Admin vê todos os itens
    return menuItems
  }

  const filteredMenuItems = getFilteredMenuItems()

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Luvas Dois Irmãos</h1>
        <p className="text-sm text-muted-foreground">Sistema de Gestão</p>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => {
            logout()
            setMobileOpen(false)
          }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background border-b border-border">
        <h1 className="text-lg font-bold">Luvas Dois Irmãos</h1>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex-col">
        <NavContent />
      </aside>
    </>
  )
}
