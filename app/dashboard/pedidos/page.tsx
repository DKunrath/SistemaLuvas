"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Pedido, type Cliente, type Produto } from "@/lib/supabase"
import { formatCurrency, formatDate, getStatusColor } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const STATUS_PEDIDO = [
  { value: "pendente", label: "Pendente" },
  { value: "em_producao", label: "Em Produção" },
  { value: "pronto", label: "Pronto" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
]

export default function PedidosPage() {
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [formData, setFormData] = useState({
    cliente_id: "",
    data_pedido: new Date().toISOString().split("T")[0],
    data_entrega: "",
    status: "pendente",
    observacoes: "",
  })
  const [itens, setItens] = useState<Array<{ produto_id: string; quantidade: number; preco_unitario: number }>>([])

  async function loadData() {
    try {
      const supabase = getSupabaseClient()
      const [pedidosRes, clientesRes, produtosRes] = await Promise.all([
        supabase.from("pedidos").select("*, cliente:clientes(nome)").order("created_at", { ascending: false }),
        supabase.from("clientes").select("*").eq("ativo", true).order("nome"),
        supabase.from("produtos").select("*").eq("ativo", true).order("nome"),
      ])

      if (pedidosRes.error) throw pedidosRes.error
      setPedidos(pedidosRes.data || [])
      setClientes(clientesRes.data || [])
      setProdutos(produtosRes.data || [])
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

  function openNewDialog() {
    setSelectedPedido(null)
    setFormData({
      cliente_id: "",
      data_pedido: new Date().toISOString().split("T")[0],
      data_entrega: "",
      status: "pendente",
      observacoes: "",
    })
    setItens([{ produto_id: "", quantidade: 1, preco_unitario: 0 }])
    setDialogOpen(true)
  }

  function addItem() {
    setItens([...itens, { produto_id: "", quantidade: 1, preco_unitario: 0 }])
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string | number) {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }
    setItens(newItens)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const valorTotal = itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0)

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          ...formData,
          valor_total: valorTotal,
        })
        .select()
        .single()

      if (pedidoError) throw pedidoError

      // Inserir itens do pedido
      const itensToInsert = itens
        .filter((item) => item.produto_id)
        .map((item) => ({
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.quantidade * item.preco_unitario,
        }))

      if (itensToInsert.length > 0) {
        const { error: itensError } = await supabase.from("pedido_itens").insert(itensToInsert)
        if (itensError) throw itensError
      }

      toast({ title: "Pedido criado com sucesso" })
      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Erro ao salvar pedido:", error)
      toast({ title: "Erro ao salvar pedido", variant: "destructive" })
    }
  }

  async function updateStatus(pedidoId: string, novoStatus: string) {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("pedidos").update({ status: novoStatus }).eq("id", pedidoId)

      if (error) throw error
      toast({ title: "Status atualizado" })
      loadData()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({ title: "Erro ao atualizar status", variant: "destructive" })
    }
  }

  const columns = [
    { key: "numero_pedido", header: "Nº" },
    {
      key: "cliente",
      header: "Cliente",
      cell: (row: Pedido) => row.cliente?.nome || "-",
    },
    {
      key: "data_pedido",
      header: "Data",
      cell: (row: Pedido) => formatDate(row.data_pedido),
    },
    {
      key: "data_entrega",
      header: "Entrega",
      cell: (row: Pedido) => (row.data_entrega ? formatDate(row.data_entrega) : "-"),
    },
    {
      key: "valor_total",
      header: "Valor",
      cell: (row: Pedido) => formatCurrency(row.valor_total),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Pedido) => (
        <Select value={row.status} onValueChange={(value) => updateStatus(row.id, value)}>
          <SelectTrigger className="w-32">
            <Badge className={getStatusColor(row.status)}>
              {STATUS_PEDIDO.find((s) => s.value === row.status)?.label}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {STATUS_PEDIDO.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Pedidos" description="Gerenciamento de pedidos">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Novo Pedido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Entrega</Label>
                  <Input
                    type="date"
                    value={formData.data_entrega}
                    onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens do Pedido</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {itens.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-end">
                      <Select value={item.produto_id} onValueChange={(value) => updateItem(index, "produto_id", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={item.quantidade}
                        onChange={(e) => updateItem(index, "quantidade", Number.parseInt(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Preço Unit."
                        value={item.preco_unitario}
                        onChange={(e) => updateItem(index, "preco_unitario", Number.parseFloat(e.target.value) || 0)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <DataTable columns={columns} data={pedidos} loading={loading} />
    </div>
  )
}
