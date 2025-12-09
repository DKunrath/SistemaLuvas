"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { formatCurrency, formatNumber } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Boxes, ClipboardList, Scissors, Shirt, DollarSign, TrendingUp, TrendingDown } from "lucide-react"

interface DashboardData {
  estoqueProdutos: number
  pedidosPendentes: number
  producaoCorteHoje: number
  producaoCosturaHoje: number
  saldoCouro: number
  insumosBaixoEstoque: Array<{ nome: string; quantidade_atual: number; unidade_medida: string }>
  ultimasMovimentacoes: Array<{ tipo: string; descricao: string; data: string }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = getSupabaseClient()
        const today = new Date().toISOString().split("T")[0]

        // Carregar dados do dashboard
        const [
          { data: estoqueProdutos },
          { data: pedidosPendentes },
          { data: corteHoje },
          { data: costuraHoje },
          { data: comprasCouro },
          { data: pagamentosCouro },
          { data: insumosBaixo },
        ] = await Promise.all([
          supabase.from("estoque_produtos").select("quantidade"),
          supabase.from("pedidos").select("id").eq("status", "pendente"),
          supabase.from("controle_corte").select("pares_cortados").eq("data", today),
          supabase.from("controle_costura").select("pares_produzidos").eq("data", today),
          supabase.from("compras_couro").select("valor_total"),
          supabase.from("pagamentos_couro").select("valor"),
          supabase
            .from("insumos")
            .select("nome, quantidade_atual, unidade_medida, quantidade_minima")
            .lt("quantidade_atual", 50),
        ])

        const totalEstoque = estoqueProdutos?.reduce((acc, item) => acc + (item.quantidade || 0), 0) || 0
        const totalCorte = corteHoje?.reduce((acc, item) => acc + (item.pares_cortados || 0), 0) || 0
        const totalCostura = costuraHoje?.reduce((acc, item) => acc + (item.pares_produzidos || 0), 0) || 0
        const totalCompras = comprasCouro?.reduce((acc, item) => acc + (item.valor_total || 0), 0) || 0
        const totalPagamentos = pagamentosCouro?.reduce((acc, item) => acc + (item.valor || 0), 0) || 0

        setData({
          estoqueProdutos: totalEstoque,
          pedidosPendentes: pedidosPendentes?.length || 0,
          producaoCorteHoje: totalCorte,
          producaoCosturaHoje: totalCostura,
          saldoCouro: totalCompras - totalPagamentos,
          insumosBaixoEstoque: insumosBaixo || [],
          ultimasMovimentacoes: [],
        })
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da fábrica" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Estoque de Produtos"
          value={`${data?.estoqueProdutos || 0} pares`}
          icon={Package}
          description="Produtos acabados"
        />
        <StatsCard
          title="Pedidos Pendentes"
          value={data?.pedidosPendentes || 0}
          icon={ClipboardList}
          description="Aguardando produção"
        />
        <StatsCard
          title="Corte Hoje"
          value={`${data?.producaoCorteHoje || 0} pares`}
          icon={Scissors}
          description="Produção do dia"
        />
        <StatsCard
          title="Costura Hoje"
          value={`${data?.producaoCosturaHoje || 0} pares`}
          icon={Shirt}
          description="Produção do dia"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className={data?.saldoCouro && data.saldoCouro >= 0 ? "border-green-200" : "border-red-200"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo de Couro</CardTitle>
            {data?.saldoCouro && data.saldoCouro >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data?.saldoCouro && data.saldoCouro >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data?.saldoCouro || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.saldoCouro && data.saldoCouro >= 0 ? "Saldo positivo" : "Saldo negativo"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Insumos com Baixo Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.insumosBaixoEstoque && data.insumosBaixoEstoque.length > 0 ? (
              <div className="space-y-3">
                {data.insumosBaixoEstoque.map((insumo, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{insumo.nome}</span>
                    <Badge variant="destructive">
                      {formatNumber(insumo.quantidade_atual)} {insumo.unidade_medida}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Todos os insumos estão em níveis adequados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acesse o módulo Financeiro para ver contas a pagar e receber
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
