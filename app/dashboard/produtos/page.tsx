"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Produto } from "@/lib/supabase"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const TIPOS_LUVA = ["Vaqueta", "Raspa", "Mista", "Napa", "Outros"]

export default function ProdutosPage() {
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    tamanho: "",
    codigo_interno: "",
    unidade: "pares",
    observacoes: "",
  })

  async function loadProdutos() {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("produtos").select("*").order("nome")

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast({ title: "Erro ao carregar produtos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProdutos()
  }, [])

  function openNewDialog() {
    setSelectedProduto(null)
    setFormData({
      nome: "",
      tipo: "",
      tamanho: "",
      codigo_interno: "",
      unidade: "pares",
      observacoes: "",
    })
    setDialogOpen(true)
  }

  function openEditDialog(produto: Produto) {
    setSelectedProduto(produto)
    setFormData({
      nome: produto.nome,
      tipo: produto.tipo,
      tamanho: produto.tamanho || "",
      codigo_interno: produto.codigo_interno || "",
      unidade: produto.unidade,
      observacoes: produto.observacoes || "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()

      if (selectedProduto) {
        const { error } = await supabase.from("produtos").update(formData).eq("id", selectedProduto.id)
        if (error) throw error
        toast({ title: "Produto atualizado com sucesso" })
      } else {
        const { error } = await supabase.from("produtos").insert(formData)
        if (error) throw error
        toast({ title: "Produto cadastrado com sucesso" })
      }

      setDialogOpen(false)
      loadProdutos()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({ title: "Erro ao salvar produto", variant: "destructive" })
    }
  }

  async function handleDelete() {
    if (!selectedProduto) return
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", selectedProduto.id)

      if (error) throw error
      toast({ title: "Produto removido com sucesso" })
      setDeleteDialogOpen(false)
      loadProdutos()
    } catch (error) {
      console.error("Erro ao remover produto:", error)
      toast({ title: "Erro ao remover produto", variant: "destructive" })
    }
  }

  const columns = [
    { key: "nome", header: "Nome" },
    { key: "tipo", header: "Tipo" },
    { key: "tamanho", header: "Tamanho" },
    { key: "codigo_interno", header: "Código" },
    { key: "unidade", header: "Unidade" },
    {
      key: "ativo",
      header: "Status",
      cell: (row: Produto) => (
        <Badge variant={row.ativo ? "default" : "secondary"}>{row.ativo ? "Ativo" : "Inativo"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      cell: (row: Produto) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedProduto(row)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Produtos" description="Gerenciamento de luvas">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProduto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_LUVA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tamanho">Tamanho</Label>
                <Input
                  id="tamanho"
                  value={formData.tamanho}
                  onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                  placeholder="Ex: P, M, G, 8, 9..."
                />
              </div>
              <div>
                <Label htmlFor="codigo_interno">Código Interno</Label>
                <Input
                  id="codigo_interno"
                  value={formData.codigo_interno}
                  onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
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
      </PageHeader>

      <DataTable columns={columns as any} data={produtos.filter((p) => p.ativo) as any} loading={loading} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o produto {selectedProduto?.nome}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
