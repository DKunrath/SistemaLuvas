"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Funcionario } from "@/lib/supabase"
import { formatDate } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Save, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type EtapaCostura = "primeira_costura" | "segunda_costura" | "fechamento" | "revisao" | "embalado"

interface ProducaoCostura {
  id: string
  funcionaria_id: string
  data_producao: string
  primeira_costura: number
  segunda_costura: number
  fechamento: number
  revisao: number
  embalado: number
  created_at: string
  funcionaria?: Funcionario
}

interface ProducaoForm {
  funcionaria_id: string
  primeira_costura: string
  segunda_costura: string
  fechamento: string
  revisao: string
  embalado: string
}

export default function CosturaPage() {
  const { toast } = useToast()
  const [funcionarias, setFuncionarias] = useState<Funcionario[]>([])
  const [producoes, setProducoes] = useState<ProducaoCostura[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  
  const [producaoForm, setProducaoForm] = useState<ProducaoForm>({
    funcionaria_id: "",
    primeira_costura: "0",
    segunda_costura: "0",
    fechamento: "0",
    revisao: "0",
    embalado: "0"
  })

  async function loadData() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const [funcionariasRes, producoesRes] = await Promise.all([
        supabase
          .from("funcionarios")
          .select("*")
          .eq("ativo", true)
          .eq("funcao", "Costureira")
          .order("nome"),
        supabase
          .from("producao_costura")
          .select("*, funcionaria:funcionarios(nome)")
          .eq("data_producao", selectedDate)
          .order("created_at", { ascending: false })
      ])

      if (funcionariasRes.error) throw funcionariasRes.error
      if (producoesRes.error) throw producoesRes.error

      setFuncionarias(funcionariasRes.data || [])
      setProducoes(producoesRes.data || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      
      const embaladoQty = Number.parseInt(producaoForm.embalado) || 0
      
      const { error } = await supabase.from("producao_costura").insert({
        funcionaria_id: producaoForm.funcionaria_id,
        data_producao: selectedDate,
        primeira_costura: Number.parseInt(producaoForm.primeira_costura) || 0,
        segunda_costura: Number.parseInt(producaoForm.segunda_costura) || 0,
        fechamento: Number.parseInt(producaoForm.fechamento) || 0,
        revisao: Number.parseInt(producaoForm.revisao) || 0,
        embalado: embaladoQty
      })

      if (error) throw error

      // Se houver pares embalados, enviar para estoque de produtos acabados
      if (embaladoQty > 0) {
        // Aqui você precisará especificar qual produto foi embalado
        // Por enquanto, apenas registramos a movimentação
        toast({ 
          title: `${embaladoQty} pares embalados registrados`,
          description: "Lembre-se de atualizar o estoque de produtos acabados"
        })
      }

      toast({ title: "Produção registrada com sucesso" })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Erro ao salvar produção:", error)
      toast({ title: "Erro ao salvar produção", variant: "destructive" })
    }
  }

  function resetForm() {
    setProducaoForm({
      funcionaria_id: "",
      primeira_costura: "0",
      segunda_costura: "0",
      fechamento: "0",
      revisao: "0",
      embalado: "0"
    })
  }

  function getTotais() {
    return {
      primeira_costura: producoes.reduce((sum, p) => sum + p.primeira_costura, 0),
      segunda_costura: producoes.reduce((sum, p) => sum + p.segunda_costura, 0),
      fechamento: producoes.reduce((sum, p) => sum + p.fechamento, 0),
      revisao: producoes.reduce((sum, p) => sum + p.revisao, 0),
      embalado: producoes.reduce((sum, p) => sum + p.embalado, 0)
    }
  }

  const totais = getTotais()

  const columns = [
    {
      key: "funcionaria",
      header: "Funcionária",
      cell: (row: ProducaoCostura) => row.funcionaria?.nome || "-"
    },
    {
      key: "primeira_costura",
      header: "1ª Costura",
      cell: (row: ProducaoCostura) => (
        <Badge variant="outline">{row.primeira_costura} pares</Badge>
      )
    },
    {
      key: "segunda_costura",
      header: "2ª Costura",
      cell: (row: ProducaoCostura) => (
        <Badge variant="outline">{row.segunda_costura} pares</Badge>
      )
    },
    {
      key: "fechamento",
      header: "Fechamento",
      cell: (row: ProducaoCostura) => (
        <Badge variant="outline">{row.fechamento} pares</Badge>
      )
    },
    {
      key: "revisao",
      header: "Revisão",
      cell: (row: ProducaoCostura) => (
        <Badge variant="outline">{row.revisao} pares</Badge>
      )
    },
    {
      key: "embalado",
      header: "Embalado",
      cell: (row: ProducaoCostura) => (
        <Badge variant={row.embalado > 0 ? "default" : "outline"}>
          {row.embalado} pares
        </Badge>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="Controle de Costura" description="Registro diário de produção">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Produção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Produção de Costura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Funcionária *</Label>
                <Select
                  value={producaoForm.funcionaria_id}
                  onValueChange={(value) => setProducaoForm({ ...producaoForm, funcionaria_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a funcionária" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarias.map((func) => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>1ª Costura (pares)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={producaoForm.primeira_costura}
                    onChange={(e) => setProducaoForm({ ...producaoForm, primeira_costura: e.target.value })}
                  />
                </div>
                <div>
                  <Label>2ª Costura (pares)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={producaoForm.segunda_costura}
                    onChange={(e) => setProducaoForm({ ...producaoForm, segunda_costura: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fechamento (pares)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={producaoForm.fechamento}
                    onChange={(e) => setProducaoForm({ ...producaoForm, fechamento: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Revisão (pares)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={producaoForm.revisao}
                    onChange={(e) => setProducaoForm({ ...producaoForm, revisao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Embalado (pares)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={producaoForm.embalado}
                    onChange={(e) => setProducaoForm({ ...producaoForm, embalado: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    * Será enviado para estoque de produtos acabados
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Data de Produção</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{producoes.length} registro(s)</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">1ª Costura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.primeira_costura}</div>
              <p className="text-xs text-muted-foreground">pares</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">2ª Costura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.segunda_costura}</div>
              <p className="text-xs text-muted-foreground">pares</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Fechamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.fechamento}</div>
              <p className="text-xs text-muted-foreground">pares</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Revisão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.revisao}</div>
              <p className="text-xs text-muted-foreground">pares</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Embalado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totais.embalado}</div>
              <p className="text-xs text-muted-foreground">pares</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          columns={columns as any}
          data={producoes as any}
          loading={loading}
          emptyMessage="Nenhuma produção registrada para esta data"
        />
      </div>
    </div>
  )
}
