"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Produto, type CustoProducao } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calculator, DollarSign, Pencil, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CustoProducaoPage() {
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [custos, setCustos] = useState<CustoProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCusto, setSelectedCusto] = useState<CustoProducao | null>(null)

  const [formData, setFormData] = useState({
    produtoId: "",
    custoCouro: "",
    custoCorte: "",
    custoCostura: "",
    custoRevisao: "",
    custoVirarLuva: "",
    custoVies: "",
    custoElastico: "",
    custoLinha: "",
  })

  const [editForm, setEditForm] = useState({
    custoCouro: "",
    custoCorte: "",
    custoCostura: "",
    custoRevisao: "",
    custoVirarLuva: "",
    custoVies: "",
    custoElastico: "",
    custoLinha: "",
  })

  async function loadData() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()

      const [produtosRes, custosRes] = await Promise.all([
        supabase.from("produtos").select("*").eq("ativo", true).order("nome"),
        supabase.from("custos_producao").select("*, produto:produtos(*)").order("created_at", { ascending: false })
      ])

      if (produtosRes.error) throw produtosRes.error
      if (custosRes.error) throw custosRes.error

      setProdutos(produtosRes.data || [])
      setCustos(custosRes.data || [])
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

  const calcularCustoTotal = () => {
    const valores = [
      formData.custoCouro,
      formData.custoCorte,
      formData.custoCostura,
      formData.custoRevisao,
      formData.custoVirarLuva,
      formData.custoVies,
      formData.custoElastico,
      formData.custoLinha,
    ]

    return valores.reduce((total, valor) => {
      const numero = Number.parseFloat(valor) || 0
      return total + numero
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.produtoId) {
      toast({ title: "Selecione um produto", variant: "destructive" })
      return
    }

    try {
      const supabase = getSupabaseClient()

      const dataToSave = {
        produto_id: formData.produtoId,
        custo_couro: Number.parseFloat(formData.custoCouro) || 0,
        custo_corte: Number.parseFloat(formData.custoCorte) || 0,
        custo_costura: Number.parseFloat(formData.custoCostura) || 0,
        custo_revisao: Number.parseFloat(formData.custoRevisao) || 0,
        custo_virar_luva: Number.parseFloat(formData.custoVirarLuva) || 0,
        custo_vies: Number.parseFloat(formData.custoVies) || 0,
        custo_elastico: Number.parseFloat(formData.custoElastico) || 0,
        custo_linha: Number.parseFloat(formData.custoLinha) || 0,
      }

      // Verifica se já existe um custo para este produto
      const { data: existente } = await supabase
        .from("custos_producao")
        .select("id")
        .eq("produto_id", formData.produtoId)
        .single()

      if (existente) {
        // Atualiza
        const { error } = await supabase
          .from("custos_producao")
          .update(dataToSave)
          .eq("id", existente.id)
        
        if (error) throw error
        toast({ title: "Custo atualizado com sucesso" })
      } else {
        // Insere
        const { error } = await supabase.from("custos_producao").insert(dataToSave)
        if (error) throw error
        toast({ title: "Custo cadastrado com sucesso" })
      }

      handleReset()
      loadData()
    } catch (error) {
      console.error("Erro ao salvar custo:", error)
      toast({ title: "Erro ao salvar custo", variant: "destructive" })
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCusto) return

    try {
      const supabase = getSupabaseClient()

      const dataToSave = {
        custo_couro: Number.parseFloat(editForm.custoCouro) || 0,
        custo_corte: Number.parseFloat(editForm.custoCorte) || 0,
        custo_costura: Number.parseFloat(editForm.custoCostura) || 0,
        custo_revisao: Number.parseFloat(editForm.custoRevisao) || 0,
        custo_virar_luva: Number.parseFloat(editForm.custoVirarLuva) || 0,
        custo_vies: Number.parseFloat(editForm.custoVies) || 0,
        custo_elastico: Number.parseFloat(editForm.custoElastico) || 0,
        custo_linha: Number.parseFloat(editForm.custoLinha) || 0,
      }

      const { error } = await supabase
        .from("custos_producao")
        .update(dataToSave)
        .eq("id", selectedCusto.id)

      if (error) throw error

      toast({ title: "Custo atualizado com sucesso" })
      setEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Erro ao atualizar custo:", error)
      toast({ title: "Erro ao atualizar custo", variant: "destructive" })
    }
  }

  function openEditDialog(custo: CustoProducao) {
    setSelectedCusto(custo)
    setEditForm({
      custoCouro: custo.custo_couro.toString(),
      custoCorte: custo.custo_corte.toString(),
      custoCostura: custo.custo_costura.toString(),
      custoRevisao: custo.custo_revisao.toString(),
      custoVirarLuva: custo.custo_virar_luva.toString(),
      custoVies: custo.custo_vies.toString(),
      custoElastico: custo.custo_elastico.toString(),
      custoLinha: custo.custo_linha.toString(),
    })
    setEditDialogOpen(true)
  }

  const handleReset = () => {
    setFormData({
      produtoId: "",
      custoCouro: "",
      custoCorte: "",
      custoCostura: "",
      custoRevisao: "",
      custoVirarLuva: "",
      custoVies: "",
      custoElastico: "",
      custoLinha: "",
    })
  }

  const handleProdutoChange = (produtoId: string) => {
    setFormData({ ...formData, produtoId })
    
    // Carrega os custos existentes se houver
    const custoExistente = custos.find(c => c.produto_id === produtoId)
    if (custoExistente) {
      setFormData({
        produtoId,
        custoCouro: custoExistente.custo_couro.toString(),
        custoCorte: custoExistente.custo_corte.toString(),
        custoCostura: custoExistente.custo_costura.toString(),
        custoRevisao: custoExistente.custo_revisao.toString(),
        custoVirarLuva: custoExistente.custo_virar_luva.toString(),
        custoVies: custoExistente.custo_vies.toString(),
        custoElastico: custoExistente.custo_elastico.toString(),
        custoLinha: custoExistente.custo_linha.toString(),
      })
    }
  }

  const custoTotal = calcularCustoTotal()
  const margemSugerida20 = custoTotal * 1.2
  const margemSugerida30 = custoTotal * 1.3
  const margemSugerida40 = custoTotal * 1.4

  const produtoSelecionado = produtos.find(p => p.id === formData.produtoId)

  const columns = [
    {
      key: "produto",
      header: "Produto",
      cell: (row: CustoProducao) => row.produto?.nome || "-"
    },
    {
      key: "custo_couro",
      header: "Couro",
      cell: (row: CustoProducao) => formatCurrency(row.custo_couro)
    },
    {
      key: "custo_corte",
      header: "Corte",
      cell: (row: CustoProducao) => formatCurrency(row.custo_corte)
    },
    {
      key: "custo_costura",
      header: "Costura",
      cell: (row: CustoProducao) => formatCurrency(row.custo_costura)
    },
    {
      key: "custo_revisao",
      header: "Revisão",
      cell: (row: CustoProducao) => formatCurrency(row.custo_revisao)
    },
    {
      key: "custo_virar_luva",
      header: "Virar",
      cell: (row: CustoProducao) => formatCurrency(row.custo_virar_luva)
    },
    {
      key: "custo_vies",
      header: "Viés",
      cell: (row: CustoProducao) => formatCurrency(row.custo_vies)
    },
    {
      key: "custo_elastico",
      header: "Elástico",
      cell: (row: CustoProducao) => formatCurrency(row.custo_elastico)
    },
    {
      key: "custo_linha",
      header: "Linha",
      cell: (row: CustoProducao) => formatCurrency(row.custo_linha)
    },
    {
      key: "custo_total",
      header: "Total",
      cell: (row: CustoProducao) => (
        <Badge variant="default">{formatCurrency(row.custo_total)}</Badge>
      )
    },
    {
      key: "actions",
      header: "Ações",
      cell: (row: CustoProducao) => (
        <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Custo de Produção" 
        description="Calcule e gerencie o custo de produção das luvas"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Custos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Componentes de Custo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="produto">Produto *</Label>
                <Select value={formData.produtoId} onValueChange={handleProdutoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome} {produto.tipo && `- ${produto.tipo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custoCouro">Custo do Couro (R$/par)</Label>
                  <Input
                    id="custoCouro"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoCouro}
                    onChange={(e) => setFormData({ ...formData, custoCouro: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="custoCorte">Custo de Corte (R$/par)</Label>
                  <Input
                    id="custoCorte"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoCorte}
                    onChange={(e) => setFormData({ ...formData, custoCorte: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="custoCostura">Custo de Costura (R$/par)</Label>
                  <Input
                    id="custoCostura"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoCostura}
                    onChange={(e) => setFormData({ ...formData, custoCostura: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="custoRevisao">Custo de Revisão (R$/par)</Label>
                  <Input
                    id="custoRevisao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoRevisao}
                    onChange={(e) => setFormData({ ...formData, custoRevisao: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="custoVirarLuva">Custo de Virar a Luva (R$/par)</Label>
                  <Input
                    id="custoVirarLuva"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoVirarLuva}
                    onChange={(e) => setFormData({ ...formData, custoVirarLuva: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="custoVies">Custo de Viés (R$/par)</Label>
                  <Input
                    id="custoVies"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.custoVies}
                    onChange={(e) => setFormData({ ...formData, custoVies: e.target.value })}
                    placeholder="0.000"
                  />
                </div>

                <div>
                  <Label htmlFor="custoElastico">Custo de Elástico (R$/par)</Label>
                  <Input
                    id="custoElastico"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.custoElastico}
                    onChange={(e) => setFormData({ ...formData, custoElastico: e.target.value })}
                    placeholder="0.000"
                  />
                </div>

                <div>
                  <Label htmlFor="custoLinha">Custo de Linha (R$/par)</Label>
                  <Input
                    id="custoLinha"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.custoLinha}
                    onChange={(e) => setFormData({ ...formData, custoLinha: e.target.value })}
                    placeholder="0.000"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Limpar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Custo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resumo de Custos */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo de Custos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {produtoSelecionado && (
                <div className="pb-2 border-b">
                  <p className="text-xs text-muted-foreground">Produto</p>
                  <p className="font-semibold">{produtoSelecionado.nome}</p>
                  {produtoSelecionado.tipo && (
                    <p className="text-xs text-muted-foreground">{produtoSelecionado.tipo}</p>
                  )}
                </div>
              )}

              <div className="space-y-2 text-sm">
                {formData.custoCouro && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Couro:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoCouro))}</span>
                  </div>
                )}
                {formData.custoCorte && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Corte:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoCorte))}</span>
                  </div>
                )}
                {formData.custoCostura && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costura:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoCostura))}</span>
                  </div>
                )}
                {formData.custoRevisao && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revisão:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoRevisao))}</span>
                  </div>
                )}
                {formData.custoVirarLuva && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Virar Luva:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoVirarLuva))}</span>
                  </div>
                )}
                {formData.custoVies && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Viés:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoVies))}</span>
                  </div>
                )}
                {formData.custoElastico && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Elástico:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoElastico))}</span>
                  </div>
                )}
                {formData.custoLinha && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Linha:</span>
                    <span>{formatCurrency(Number.parseFloat(formData.custoLinha))}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Custo Total:</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {formatCurrency(custoTotal)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Preços Sugeridos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <span className="text-sm">Margem 20%:</span>
                <span className="font-semibold text-green-600">{formatCurrency(margemSugerida20)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <span className="text-sm">Margem 30%:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(margemSugerida30)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded-lg">
                <span className="text-sm">Margem 40%:</span>
                <span className="font-semibold text-orange-600">{formatCurrency(margemSugerida40)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                * Preços calculados com base no custo total de produção
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabela de Custos Cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns as any}
            data={custos as any}
            loading={loading}
            emptyMessage="Nenhum custo cadastrado"
          />
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Custo de Produção</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {selectedCusto && (
              <div className="pb-2 border-b">
                <p className="text-sm font-semibold">{selectedCusto.produto?.nome}</p>
                {selectedCusto.produto?.tipo && (
                  <p className="text-xs text-muted-foreground">{selectedCusto.produto.tipo}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Custo do Couro (R$/par)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.custoCouro}
                  onChange={(e) => setEditForm({ ...editForm, custoCouro: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Corte (R$/par)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.custoCorte}
                  onChange={(e) => setEditForm({ ...editForm, custoCorte: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Costura (R$/par)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.custoCostura}
                  onChange={(e) => setEditForm({ ...editForm, custoCostura: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Revisão (R$/par)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.custoRevisao}
                  onChange={(e) => setEditForm({ ...editForm, custoRevisao: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Virar a Luva (R$/par)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.custoVirarLuva}
                  onChange={(e) => setEditForm({ ...editForm, custoVirarLuva: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Viés (R$/par)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={editForm.custoVies}
                  onChange={(e) => setEditForm({ ...editForm, custoVies: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Elástico (R$/par)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={editForm.custoElastico}
                  onChange={(e) => setEditForm({ ...editForm, custoElastico: e.target.value })}
                />
              </div>

              <div>
                <Label>Custo de Linha (R$/par)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.custoLinha}
                  onChange={(e) => setEditForm({ ...editForm, custoLinha: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
