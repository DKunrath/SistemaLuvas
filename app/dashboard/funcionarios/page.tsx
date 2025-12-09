"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Funcionario } from "@/lib/supabase"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const SETORES = ["Corte", "Costura", "Embalagem", "Administração", "Outros"]

export default function FuncionariosPage() {
  const { toast } = useToast()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    setor: "",
    funcao: "",
    tipo_funcionario: "interno" as "interno" | "externo",
    data_admissao: "",
    salario: "",
  })

  async function loadFuncionarios() {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("funcionarios").select("*").order("nome")

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
      toast({ title: "Erro ao carregar funcionários", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFuncionarios()
  }, [])

  function openNewDialog() {
    setSelectedFuncionario(null)
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      setor: "",
      funcao: "",
      tipo_funcionario: "interno",
      data_admissao: "",
      salario: "",
    })
    setDialogOpen(true)
  }

  function openEditDialog(funcionario: Funcionario) {
    setSelectedFuncionario(funcionario)
    setFormData({
      nome: funcionario.nome,
      cpf: funcionario.cpf || "",
      telefone: funcionario.telefone || "",
      setor: funcionario.setor || "",
      funcao: funcionario.funcao || "",
      tipo_funcionario: (funcionario.tipo_funcionario as "interno" | "externo") || "interno",
      data_admissao: funcionario.data_admissao || "",
      salario: funcionario.salario?.toString() || "",
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const dataToSave = {
        ...formData,
        salario: formData.salario ? Number.parseFloat(formData.salario) : null,
        data_admissao: formData.data_admissao || null,
        tipo_funcionario: formData.tipo_funcionario,
      }

      if (selectedFuncionario) {
        const { error } = await supabase.from("funcionarios").update(dataToSave).eq("id", selectedFuncionario.id)
        if (error) throw error
        toast({ title: "Funcionário atualizado com sucesso" })
      } else {
        const { error } = await supabase.from("funcionarios").insert(dataToSave)
        if (error) throw error
        toast({ title: "Funcionário cadastrado com sucesso" })
      }

      setDialogOpen(false)
      loadFuncionarios()
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error)
      toast({ title: "Erro ao salvar funcionário", variant: "destructive" })
    }
  }

  async function handleToggleStatus() {
    if (!selectedFuncionario) return
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("funcionarios")
        .update({ ativo: !selectedFuncionario.ativo })
        .eq("id", selectedFuncionario.id)

      if (error) throw error
      toast({ title: `Funcionário ${selectedFuncionario.ativo ? "desativado" : "ativado"} com sucesso` })
      setDeleteDialogOpen(false)
      loadFuncionarios()
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast({ title: "Erro ao alterar status", variant: "destructive" })
    }
  }

  const columns = [
    { key: "nome", header: "Nome" },
    { key: "setor", header: "Setor" },
    { key: "funcao", header: "Função" },
    { key: "telefone", header: "Telefone" },
    {
      key: "ativo",
      header: "Status",
      cell: (row: Funcionario) => (
        <Badge variant={row.ativo ? "default" : "secondary"}>{row.ativo ? "Ativo" : "Inativo"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      cell: (row: Funcionario) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedFuncionario(row)
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
      <PageHeader title="Funcionários" description="Gerenciamento de funcionários">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedFuncionario ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="setor">Setor</Label>
                  <Select value={formData.setor} onValueChange={(value) => setFormData({ ...formData, setor: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETORES.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="funcao">Função</Label>
                  <Input
                    id="funcao"
                    value={formData.funcao}
                    onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_admissao">Data Admissão</Label>
                  <Input
                    id="data_admissao"
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tipo_funcionario">Tipo</Label>
                  <Select 
                    value={formData.tipo_funcionario} 
                    onValueChange={(value: "interno" | "externo") => setFormData({ ...formData, tipo_funcionario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interno">Interno</SelectItem>
                      <SelectItem value="externo">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="salario">Salário</Label>
                <Input
                  id="salario"
                  type="number"
                  step="0.01"
                  value={formData.salario}
                  onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
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

      <DataTable columns={columns} data={funcionarios} loading={loading} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar status</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja {selectedFuncionario?.ativo ? "desativar" : "ativar"} o funcionário {selectedFuncionario?.nome}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
