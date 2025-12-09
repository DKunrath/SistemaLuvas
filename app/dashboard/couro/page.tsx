"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { formatDate, formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, DollarSign, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataTable } from "@/components/data-table"

interface CompraCouro {
  id: string
  tipo_couro: string
  metros: number
  classe: string
  qtd_pacotes: number
  preco_unitario: number
  valor_total: number
  data_compra: string
  fornecedor: string
  numero_pedido?: string
  local_observacoes?: string
  created_at: string
}

interface PagamentoNF {
  id: string
  numero_nf: string
  valor: number
  cliente: string
  data_pagamento: string
  empresa_emissora: string
  created_at: string
}

export default function CouroPage() {
  const { toast } = useToast()
  const [compras, setCompras] = useState<CompraCouro[]>([])
  const [pagamentos, setPagamentos] = useState<PagamentoNF[]>([])
  const [loading, setLoading] = useState(true)
  const [compraDialogOpen, setCompraDialogOpen] = useState(false)
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false)

  const [compraForm, setCompraForm] = useState({
    tipo_couro: "",
    metros: "",
    classe: "",
    qtd_pacotes: "",
    preco_unitario: "",
    data_compra: new Date().toISOString().split("T")[0],
    fornecedor: "",
    numero_pedido: "",
    local_observacoes: ""
  })

  const [pagamentoForm, setPagamentoForm] = useState({
    numero_nf: "",
    valor: "",
    cliente: "",
    data_pagamento: new Date().toISOString().split("T")[0],
    empresa_emissora: ""
  })

  const valorTotalCompra = compraForm.metros && compraForm.preco_unitario
    ? (Number.parseFloat(compraForm.metros) * Number.parseFloat(compraForm.preco_unitario)).toFixed(2)
    : "0.00"

  async function loadData() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()

      const [comprasRes, pagamentosRes] = await Promise.all([
        supabase.from("compras_couro").select("*"),
        supabase.from("pagamentos_couro_nf").select("*").order("data_pagamento", { ascending: false })
      ])

      if (comprasRes.error) throw comprasRes.error
      if (pagamentosRes.error) throw pagamentosRes.error

      // Ordenar por numero_pedido numericamente de forma decrescente
      const comprasOrdenadas = (comprasRes.data || []).sort((a, b) => {
        const numA = a.numero_pedido ? parseInt(a.numero_pedido) : 0
        const numB = b.numero_pedido ? parseInt(b.numero_pedido) : 0
        return numB - numA
      })

      setCompras(comprasOrdenadas)
      setPagamentos(pagamentosRes.data || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCompraSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()

      const metros = Number.parseFloat(compraForm.metros)
      const precoUnitario = Number.parseFloat(compraForm.preco_unitario)

      const { error } = await supabase.from("compras_couro").insert({
        tipo_couro: compraForm.tipo_couro,
        metros: metros,
        classe: compraForm.classe,
        qtd_pacotes: Number.parseInt(compraForm.qtd_pacotes),
        preco_unitario: precoUnitario,
        valor_total: metros * precoUnitario,
        data_compra: compraForm.data_compra,
        fornecedor: compraForm.fornecedor,
        numero_pedido: compraForm.numero_pedido || null,
        local_observacoes: compraForm.local_observacoes || null
      })

      if (error) throw error

      toast({ title: "Compra registrada com sucesso" })
      setCompraDialogOpen(false)
      resetCompraForm()
      loadData()
    } catch (error) {
      console.error("Erro ao salvar compra:", error)
      toast({ title: "Erro ao salvar compra", variant: "destructive" })
    }
  }

  async function handlePagamentoSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.from("pagamentos_couro_nf").insert({
        numero_nf: pagamentoForm.numero_nf,
        valor: Number.parseFloat(pagamentoForm.valor),
        cliente: pagamentoForm.cliente,
        data_pagamento: pagamentoForm.data_pagamento,
        empresa_emissora: pagamentoForm.empresa_emissora
      })

      if (error) throw error

      toast({ title: "Pagamento registrado com sucesso" })
      setPagamentoDialogOpen(false)
      resetPagamentoForm()
      loadData()
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error)
      toast({ title: "Erro ao salvar pagamento", variant: "destructive" })
    }
  }

  function resetCompraForm() {
    setCompraForm({
      tipo_couro: "",
      metros: "",
      classe: "",
      qtd_pacotes: "",
      preco_unitario: "",
      data_compra: new Date().toISOString().split("T")[0],
      fornecedor: "",
      numero_pedido: "",
      local_observacoes: ""
    })
  }

  function resetPagamentoForm() {
    setPagamentoForm({
      numero_nf: "",
      valor: "",
      cliente: "",
      data_pagamento: new Date().toISOString().split("T")[0],
      empresa_emissora: ""
    })
  }

  function calcularSaldo() {
    const totalCompras = compras.reduce((sum, c) => sum + c.valor_total, 0)
    const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0)
    const saldo = totalCompras - totalPagamentos

    return {
      totalCompras,
      totalPagamentos,
      saldo,
      isPositive: saldo >= 0
    }
  }

  const saldoInfo = calcularSaldo()

  const comprasColumns = [
    {
      key: "data_compra",
      header: "Data",
      cell: (row: CompraCouro) => formatDate(row.data_compra)
    },
    {
      key: "fornecedor",
      header: "Fornecedor"
    },
    {
      key: "tipo_couro",
      header: "Tipo de Couro"
    },
    {
      key: "metros",
      header: "Quantidade",
      cell: (row: CompraCouro) => {
        const isRaspa = row.tipo_couro.toLowerCase().includes('raspa')
        const isSotocrosta = row.classe.toLowerCase().includes('sotocrosta')
        const unidade = (isRaspa && isSotocrosta) ? 'Kg' : 'm²'
        return `${row.metros.toFixed(2)} ${unidade}`
      }
    },
    {
      key: "classe",
      header: "Classe"
    },
    {
      key: "qtd_pacotes",
      header: "Pacotes"
    },
    {
      key: "preco_unitario",
      header: "Preço Unit.",
      cell: (row: CompraCouro) => formatCurrency(row.preco_unitario)
    },
    {
      key: "valor_total",
      header: "Valor Total",
      cell: (row: CompraCouro) => (
        <Badge variant="default">{formatCurrency(row.valor_total)}</Badge>
      )
    },
    {
      key: "numero_pedido",
      header: "Nº Pedido",
      cell: (row: CompraCouro) => row.numero_pedido || "-"
    }
  ]

  const pagamentosColumns = [
    {
      key: "data_pagamento",
      header: "Data",
      cell: (row: PagamentoNF) => formatDate(row.data_pagamento)
    },
    {
      key: "numero_nf",
      header: "Nº NF"
    },
    {
      key: "cliente",
      header: "Cliente"
    },
    {
      key: "valor",
      header: "Valor",
      cell: (row: PagamentoNF) => (
        <Badge variant="default">{formatCurrency(row.valor)}</Badge>
      )
    },
    {
      key: "empresa_emissora",
      header: "Empresa Emissora"
    },
    {
      key: "situacao_fixed",
      header: "Situação",
      cell: () => (
        <Badge variant="default">PAG COURO</Badge>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="Controle de Couro" description="Compras, pagamentos e saldo de couro">
        <div className="flex gap-2">
          <Dialog open={compraDialogOpen} onOpenChange={setCompraDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetCompraForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Compra de Couro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCompraSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Couro *</Label>
                    <Input
                      value={compraForm.tipo_couro}
                      onChange={(e) => setCompraForm({ ...compraForm, tipo_couro: e.target.value })}
                      required
                      placeholder="Ex: Couro Bovino, Sintético..."
                    />
                  </div>
                  <div>
                    <Label>Fornecedor *</Label>
                    <Input
                      value={compraForm.fornecedor}
                      onChange={(e) => setCompraForm({ ...compraForm, fornecedor: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Metros (m²) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={compraForm.metros}
                      onChange={(e) => setCompraForm({ ...compraForm, metros: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Classe *</Label>
                    <Input
                      value={compraForm.classe}
                      onChange={(e) => setCompraForm({ ...compraForm, classe: e.target.value })}
                      required
                      placeholder="Ex: A, B, C..."
                    />
                  </div>
                  <div>
                    <Label>Quantidade de Pacotes *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={compraForm.qtd_pacotes}
                      onChange={(e) => setCompraForm({ ...compraForm, qtd_pacotes: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Preço Unitário (R$/m²) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={compraForm.preco_unitario}
                      onChange={(e) => setCompraForm({ ...compraForm, preco_unitario: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Data da Compra *</Label>
                    <Input
                      type="date"
                      value={compraForm.data_compra}
                      onChange={(e) => setCompraForm({ ...compraForm, data_compra: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Número do Pedido</Label>
                    <Input
                      value={compraForm.numero_pedido}
                      onChange={(e) => setCompraForm({ ...compraForm, numero_pedido: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Local / Observações</Label>
                    <Textarea
                      value={compraForm.local_observacoes}
                      onChange={(e) => setCompraForm({ ...compraForm, local_observacoes: e.target.value })}
                      placeholder="Informações adicionais..."
                    />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Valor Total:</span>
                    <span className="text-2xl font-bold">{formatCurrency(Number.parseFloat(valorTotalCompra))}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCompraDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Compra</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetPagamentoForm}>
                <FileText className="h-4 w-4 mr-2" />
                Registrar Pagamento (NF)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Pagamento com Nota Fiscal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePagamentoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número da NF *</Label>
                    <Input
                      value={pagamentoForm.numero_nf}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, numero_nf: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Cliente *</Label>
                    <Input
                      value={pagamentoForm.cliente}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, cliente: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={pagamentoForm.valor}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, valor: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Data da Nota *</Label>
                    <Input
                      type="date"
                      value={pagamentoForm.data_pagamento}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, data_pagamento: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Empresa Emissora *</Label>
                    <Input
                      value={pagamentoForm.empresa_emissora}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, empresa_emissora: e.target.value })}
                      required
                      placeholder="Nome da empresa que emitiu a nota"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPagamentoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Pagamento</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Saldo Consolidado */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Comprado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(saldoInfo.totalCompras)}</div>
              <p className="text-xs text-muted-foreground">em compras de couro</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Pago (NF)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(saldoInfo.totalPagamentos)}</div>
              <p className="text-xs text-muted-foreground">em notas fiscais</p>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Saldo Final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${saldoInfo.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(saldoInfo.saldo))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {saldoInfo.isPositive 
                  ? "Saldo devedor - você deve pagar este valor" 
                  : "Saldo credor - você tem este valor a receber"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Fórmula: Total Compras - Total Pagamentos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Compras e Pagamentos */}
        <Tabs defaultValue="compras">
          <TabsList>
            <TabsTrigger value="compras">Compras de Couro</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos (NFs)</TabsTrigger>
          </TabsList>

          <TabsContent value="compras">
            <DataTable
              columns={comprasColumns as any}
              data={compras as any}
              loading={loading}
              emptyMessage="Nenhuma compra registrada"
            />
          </TabsContent>

          <TabsContent value="pagamentos">
            <DataTable
              columns={pagamentosColumns as any}
              data={pagamentos as any}
              loading={loading}
              emptyMessage="Nenhum pagamento registrado"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
