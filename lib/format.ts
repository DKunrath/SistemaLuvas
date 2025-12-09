export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: string | Date): string {
  if (typeof date === "string") {
    // Se a data está no formato YYYY-MM-DD, faz parsing manual para evitar timezone issues
    const [year, month, day] = date.split("-").map(Number)
    if (year && month && day) {
      return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day))
    }
  }
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("pt-BR").format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCurrencyWithDecimals(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-800",
    em_producao: "bg-blue-100 text-blue-800",
    pronto: "bg-green-100 text-green-800",
    entregue: "bg-gray-100 text-gray-800",
    cancelado: "bg-red-100 text-red-800",
    pago: "bg-green-100 text-green-800",
    recebido: "bg-green-100 text-green-800",
    atrasado: "bg-red-100 text-red-800",
    aceite: "bg-green-100 text-green-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function getRendimentoColor(rendimento: number): string {
  if (rendimento > 4.2) return "text-green-600"
  if (rendimento === 4.2) return "text-yellow-600"
  return "text-red-600"
}

export function getRendimentoLabel(rendimento: number): string {
  if (rendimento > 4.2) return "Bom"
  if (rendimento === 4.2) return "Normal"
  return "Ruim"
}
