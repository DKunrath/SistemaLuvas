"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Insumo, type InsumoCategoria, type InsumoMovimentacao } from "@/lib/supabase"
import { formatDate, formatNumber } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EstoqueInsumosPage() {
  const { toast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [categorias, setCategorias] = useState<InsumoCategoria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<InsumoMovimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [movDialogOpen, setMovDialogOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  
  const [insumoForm, setInsumoForm] = useState({
    nome: "",
    categoria_id: "",
    unidade_medida: "",
    cor_variacao: "",
    quantidade_atual: "",
    quantidade_minima: "",
    lote: "",
    data_validade: "",
    observacoes: ""
  })

  const [movForm, setMovForm] = useState({
    insumo_id: "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    motivo: ""
  })

  async function loadData() {
    try {
      const supabase = getSupabaseClient()
      const [insumosRes, categoriasRes, movRes] = await Promise.all([
        supabase.from('insumos').select('*, categoria:insumo_categorias(nome)').eq('ativo', true).order('nome'),
        supabase.from('insumo_categorias').select('*').order('nome'),
        supabase.from('insumo_movimentacoes').select('*, insumo:insumos(nome)').order('created_at', { ascending: false }).limit(50)
      ])

      if (insumosRes.error) throw insumosRes.error
      setInsumos(insumosRes.data || [])
      setCategorias(categoriasRes.data || [])
      setMovimentacoes(movRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openNewInsumoDialog() {
    setSelectedInsumo(null)
    setInsumoForm({
      nome: "",
      categoria_id: "",
      unidade_medida: "",
      cor_variacao: "",
      quantidade_atual: "0",
      quantidade_minima: "0",
      lote: "",
      data_validade: "",
      observacoes: ""
    })
    setDialogOpen(true)
  }

  function openEditInsumoDialog(insumo: Insumo) {
    setSelectedInsumo(insumo)
    setInsumoForm({
      nome: insumo.nome,
      categoria_id: insumo.categoria_id,
      unidade_medida: insumo.unidade_medida,
      cor_variacao: insumo.cor_variacao || "",
      quantidade_atual: insumo.quantidade_atual.toString(),
      quantidade_minima: insumo.quantidade_minima.toString(),
      lote: insumo.lote || "",
      data_validade: insumo.data_validade || "",
      observacoes: insumo.observacoes || ""
    })
    setDialogOpen(true)
  }

  async function handleInsumoSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const dataToSave = {
        ...insumoForm,
        quantidade_atual: Number.parseFloat(insumoForm.quantidade_atual) || 0,
        quantidade_minima: Number.parseFloat(insumoForm.quantidade_minima) || 0,
        data_validade: insumoForm.data_validade || null
      }

      if (selectedInsumo) {
        const { error } = await supabase
          .from('insumos')
          .update(dataToSave)
          .eq('id', selectedInsumo.id)
        if (error) throw error
        toast({ title: "Insumo atualizado com sucesso" })
      } else {
        const { error } = await supabase
          .from('insumos')
          .insert(dataToSave)
        if (error) throw error
        toast({ title: "Insumo cadastrado com sucesso" })
      }

      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Erro ao salvar insumo:', error)
      toast({ title: "Erro ao salvar insumo", variant: "destructive" })
    }
  }

  async function handleMovSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      
      const { error } = await supabase
        .from('insumo_movimentacoes')
        .insert({
          insumo_id: movForm.insumo_id,
          tipo: movForm.tipo,
          quantidade: Number.parseFloat(movForm.quantidade),
          motivo: movForm.motivo || 'Movimentação manual'
        })

      if (error) throw error
      toast({ title: "Movimentação registrada com sucesso" })
      setMovDialogOpen(false)
      setMovForm({ insumo_id: "", tipo: "entrada", quantidade: "", motivo: "" })
      loadData()
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error)
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" })
    }
  }

  const insumosColumns = [
    { key: "nome", header: "Nome" },
    {
      key: "categoria",
      header: "Categoria",
      cell: (row: Insumo) => row.categoria?.nome || "-"
    },
    { key: "cor_variacao", header: "Cor/Variação" },
    {
      key: "quantidade_atual",
      header: "Quantidade",
      cell: (row: Insumo) => (
        <Badge variant={row.quantidade_atual > row.quantidade_minima ? "default" : "destructive"}>
          {formatNumber(row.quantidade_atual)} {row.unidade_medida}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Ações",
      cell: (row: Insumo) => (
        <Button variant="ghost" size="icon" onClick={() => openEditInsumoDialog(row)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )
    }
  ]

  const movimentacoesColumns = [
    {
      key: "created_at",
      header: "Data",
      cell: (row: InsumoMovimentacao) => formatDate(row.created_at)
    },
    {
      key: "insumo",
      header: "Insumo",
      cell: (row: InsumoMovimentacao) => row.insumo?.nome || "-"
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (row: InsumoMovimentacao) => (
        <Badge variant={row.tipo === 'entrada' ? "default" : "secondary"}>
          {row.tipo === 'entrada' ? <ArrowUpCircle className="h-3 w-3 mr-1" /> : <ArrowDownCircle className="h-3 w-3 mr-1" />}
          {row.tipo === 'entrada' ? 'Entrada' : 'Saída'}
        </Badge>
      )
    },
    {
      key: "quantidade",
      header: "Quantidade",
      cell: (row: InsumoMovimentacao) => formatNumber(row.quantidade)
    },
    { key: "motivo", header: "Motivo" }
  ]

  return (
    <div>
      <PageHeader title="Estoque de Insumos" description="Matéria-prima e materiais">
        <div className="flex gap-2">
          <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMovSubmit} className="space-y-4">
                <div>
                  <Label>Insumo *</Label>
                  <Select
                    value={movForm.insumo_id}
                    onValueChange={(value) => setMovForm({ ...movForm, insumo_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumos.map((insumo) => (
                        <SelectItem key={insumo.id} value={insumo.id}>
                          {insumo.nome} {insumo.cor_variacao && `(${insumo.cor_variacao})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={movForm.tipo}
                    onValueChange={(value: "entrada" | "saida") => setMovForm({ ...movForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={movForm.quantidade}
                    onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Textarea
                    value={movForm.motivo}
                    onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setMovDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewInsumoDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Insumo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedInsumo ? "Editar Insumo" : "Novo Insumo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInsumoSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome *</Label>
                    <Input
                      value={insumoForm.nome}
                      onChange={(e) => setInsumoForm({ ...insumoForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Categoria *</Label>
                    <Select
                      value={insumoForm.categoria_id}
                      onValueChange={(value) => setInsumoForm({ ...insumoForm, categoria_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade de Medida *</Label>
                    <Select
                      value={insumoForm.unidade_medida}
                      onValueChange={(value) => setInsumoForm({ ...insumoForm, unidade_medida: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m²">m² (metros quadrados)</SelectItem>
                        <SelectItem value="metros">Metros</SelectItem>
                        <SelectItem value="kg">Kg (quilogramas)</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
                        <SelectItem value="pacotes">Pacotes</SelectItem>
                        <SelectItem value="litros">Litros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cor / Variação</Label>
                    <Input
                      value={insumoForm.cor_variacao}
                      onChange={(e) => setInsumoForm({ ...insumoForm, cor_variacao: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Lote</Label>
                    <Input
                      value={insumoForm.lote}
                      onChange={(e) => setInsumoForm({ ...insumoForm, lote: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Quantidade Inicial</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={insumoForm.quantidade_atual}
                      onChange={(e) => setInsumoForm({ ...insumoForm, quantidade_atual: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Quantidade Mínima</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={insumoForm.quantidade_minima}
                      onChange={(e) => setInsumoForm({ ...insumoForm, quantidade_minima: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Data de Validade</Label>
                    <Input
                      type="date"
                      value={insumoForm.data_validade}
                      onChange={(e) => setInsumoForm({ ...insumoForm, data_validade: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={insumoForm.observacoes}
                      onChange={(e) => setInsumoForm({ ...insumoForm, observacoes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Insumos</h3>
          <DataTable
            columns={insumosColumns}
            data={insumos}
            loading={loading}
            emptyMessage="Nenhum insumo cadastrado"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Últimas Movimentações</h3>
          <DataTable
            columns={movimentacoesColumns}
            data={movimentacoes}
            loading={loading}
            emptyMessage="Nenhuma movimentação registrada"
          />
        </div>
      </div>
    </div>
  )
}
