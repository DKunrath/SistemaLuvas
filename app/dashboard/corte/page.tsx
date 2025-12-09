"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type Funcionario } from "@/lib/supabase"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Scissors, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProducaoCorte {
  id: string
  funcionario_id: string
  data_producao: string
  metros_couro_entregues: number
  pares_cortados: number
  rendimento: number
  observacoes?: string
  created_at: string
  funcionario?: Funcionario
}

export default function CortePage() {
  const { toast } = useToast()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [producoes, setProducoes] = useState<ProducaoCorte[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  
  const [corteForm, setCorteForm] = useState({
    funcionario_id: "",
    metros_couro_entregues: "",
    pares_cortados: "",
    observacoes: ""
  })

  // Fórmula de rendimento: pares / metros
  const rendimentoCalculado = corteForm.metros_couro_entregues && corteForm.pares_cortados
    ? (Number.parseFloat(corteForm.pares_cortados) / Number.parseFloat(corteForm.metros_couro_entregues)).toFixed(2)
    : "0.00"

  async function loadData() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const [funcionariosRes, producoesRes] = await Promise.all([
        supabase
          .from("funcionarios")
          .select("*")
          .eq("ativo", true)
          .eq("funcao", "Cortador")
          .order("nome"),
        supabase
          .from("producao_corte")
          .select("*, funcionario:funcionarios(nome)")
          .eq("data_producao", selectedDate)
          .order("created_at", { ascending: false })
      ])

      if (funcionariosRes.error) throw funcionariosRes.error
      if (producoesRes.error) throw producoesRes.error

      setFuncionarios(funcionariosRes.data || [])
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
      
      const metros = Number.parseFloat(corteForm.metros_couro_entregues)
      const pares = Number.parseInt(corteForm.pares_cortados)
      const rendimento = metros > 0 ? pares / metros : 0

      const { error } = await supabase.from("producao_corte").insert({
        funcionario_id: corteForm.funcionario_id,
        data_producao: selectedDate,
        metros_couro_entregues: metros,
        pares_cortados: pares,
        rendimento: rendimento,
        observacoes: corteForm.observacoes || null
      })

      if (error) throw error

      toast({ title: "Produção de corte registrada com sucesso" })
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Erro ao salvar produção:", error)
      toast({ title: "Erro ao salvar produção", variant: "destructive" })
    }
  }

  function resetForm() {
    setCorteForm({
      funcionario_id: "",
      metros_couro_entregues: "",
      pares_cortados: "",
      observacoes: ""
    })
  }

  function getTotais() {
    return {
      metros: producoes.reduce((sum, p) => sum + p.metros_couro_entregues, 0),
      pares: producoes.reduce((sum, p) => sum + p.pares_cortados, 0),
      rendimentoMedio: producoes.length > 0
        ? producoes.reduce((sum, p) => sum + p.rendimento, 0) / producoes.length
        : 0
    }
  }

  const totais = getTotais()

  const columns = [
    {
      key: "data_producao",
      header: "Data",
      cell: (row: ProducaoCorte) => formatDate(row.data_producao)
    },
    {
      key: "funcionario",
      header: "Funcionário",
      cell: (row: ProducaoCorte) => row.funcionario?.nome || "-"
    },
    {
      key: "metros_couro_entregues",
      header: "Metros (m²)",
      cell: (row: ProducaoCorte) => (
        <Badge variant="outline">{formatNumber(row.metros_couro_entregues)} m²</Badge>
      )
    },
    {
      key: "pares_cortados",
      header: "Pares Cortados",
      cell: (row: ProducaoCorte) => (
        <Badge variant="default">{row.pares_cortados} pares</Badge>
      )
    },
    {
      key: "rendimento",
      header: "Rendimento",
      cell: (row: ProducaoCorte) => {
        const rendimento = row.rendimento
        const isGood = rendimento >= 3.5 // Ajuste este valor conforme necessário
        return (
          <Badge variant={isGood ? "default" : "secondary"}>
            {formatNumber(rendimento)} pares/m²
          </Badge>
        )
      }
    },
    {
      key: "observacoes",
      header: "Observações",
      cell: (row: ProducaoCorte) => (
        <span className="text-sm text-muted-foreground">
          {row.observacoes || "-"}
        </span>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="Controle de Corte" description="Registro diário de produção de corte">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Corte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Produção de Corte</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Funcionário *</Label>
                <Select
                  value={corteForm.funcionario_id}
                  onValueChange={(value) => setCorteForm({ ...corteForm, funcionario_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metros de Couro Entregues (m²) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={corteForm.metros_couro_entregues}
                    onChange={(e) => setCorteForm({ ...corteForm, metros_couro_entregues: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Pares Cortados *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={corteForm.pares_cortados}
                    onChange={(e) => setCorteForm({ ...corteForm, pares_cortados: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rendimento Calculado:</span>
                  <span className="text-2xl font-bold">{rendimentoCalculado} pares/m²</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Fórmula: Pares ÷ Metros
                </p>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={corteForm.observacoes}
                  onChange={(e) => setCorteForm({ ...corteForm, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o corte..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Scissors className="h-4 w-4 mr-2" />
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
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Total de Couro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totais.metros)}</div>
              <p className="text-xs text-muted-foreground">metros quadrados (m²)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Pares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.pares}</div>
              <p className="text-xs text-muted-foreground">pares cortados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Rendimento Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(totais.rendimentoMedio)}
              </div>
              <p className="text-xs text-muted-foreground">pares/m²</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          columns={columns as any}
          data={producoes as any}
          loading={loading}
          emptyMessage="Nenhuma produção de corte registrada para esta data"
        />
      </div>
    </div>
  )
}
