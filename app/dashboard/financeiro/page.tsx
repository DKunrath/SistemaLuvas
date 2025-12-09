"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getSupabaseClient, type ContaPagar, type ContaReceber, type Funcionario, type ValorProducao } from "@/lib/supabase"
import { formatDate, formatCurrency } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, DollarSign, TrendingUp, TrendingDown, AlertCircle, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FinanceiroPage() {
  const { toast } = useToast()
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [valoresProducao, setValoresProducao] = useState<ValorProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [pagarDialogOpen, setPagarDialogOpen] = useState(false)
  const [receberDialogOpen, setReceberDialogOpen] = useState(false)
  const [calcularPagamentoDialogOpen, setCalcularPagamentoDialogOpen] = useState(false)

  const [contaPagarForm, setContaPagarForm] = useState({
    descricao: "",
    valor: "",
    data_vencimento: new Date().toISOString().split("T")[0],
    categoria: "",
    fornecedor: "",
    observacoes: ""
  })

  const [contaReceberForm, setContaReceberForm] = useState({
    descricao: "",
    valor: "",
    data_vencimento: new Date().toISOString().split("T")[0],
    observacoes: ""
  })

  const [periodoCalculo, setPeriodoCalculo] = useState({
    data_inicio: "",
    data_fim: "",
    funcionario_id: ""
  })

  async function loadData() {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()

      const [pagarRes, receberRes, funcRes, valoresRes] = await Promise.all([
        supabase.from("contas_pagar").select("*, funcionario:funcionarios(nome)").order("data_vencimento", { ascending: false }),
        supabase.from("contas_receber").select("*, cliente:clientes(nome)").order("data_vencimento", { ascending: false }),
        supabase.from("funcionarios").select("*").eq("ativo", true).order("nome"),
        supabase.from("valores_producao").select("*").eq("ativo", true)
      ])

      setContasPagar(pagarRes.data || [])
      setContasReceber(receberRes.data || [])
      setFuncionarios(funcRes.data || [])
      setValoresProducao(valoresRes.data || [])
    } catch (error) {
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleContaPagarSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("contas_pagar").insert({
        descricao: contaPagarForm.descricao,
        valor: Number.parseFloat(contaPagarForm.valor),
        data_vencimento: contaPagarForm.data_vencimento,
        categoria: contaPagarForm.categoria || null,
        fornecedor: contaPagarForm.fornecedor || null,
        observacoes: contaPagarForm.observacoes || null,
        status: "pendente"
      })
      if (error) throw error
      toast({ title: "Conta a pagar registrada com sucesso" })
      setPagarDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ title: "Erro ao salvar conta", variant: "destructive" })
    }
  }

  async function handleContaReceberSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("contas_receber").insert({
        descricao: contaReceberForm.descricao,
        valor: Number.parseFloat(contaReceberForm.valor),
        data_vencimento: contaReceberForm.data_vencimento,
        observacoes: contaReceberForm.observacoes || null,
        status: "pendente"
      })
      if (error) throw error
      toast({ title: "Conta a receber registrada com sucesso" })
      setReceberDialogOpen(false)
      loadData()
    } catch (error) {
      toast({ title: "Erro ao salvar conta", variant: "destructive" })
    }
  }

  function calcularResumo() {
    const totalPagar = contasPagar.filter(c => c.status === "pendente").reduce((sum, c) => sum + c.valor, 0)
    const totalReceber = contasReceber.filter(c => c.status === "pendente").reduce((sum, c) => sum + c.valor, 0)
    const hoje = new Date().toISOString().split("T")[0]
    const contasVencidas = contasPagar.filter(c => c.status === "pendente" && c.data_vencimento < hoje).length

    return { totalPagar, totalReceber, contasVencidas }
  }

  const resumo = calcularResumo()

  const pagarColumns = [
    { key: "data_vencimento", header: "Vencimento", cell: (row: ContaPagar) => formatDate(row.data_vencimento) },
    { key: "descricao", header: "Descrição" },
    { key: "categoria", header: "Categoria", cell: (row: ContaPagar) => row.categoria || "-" },
    { key: "valor", header: "Valor", cell: (row: ContaPagar) => <Badge variant="destructive">{formatCurrency(row.valor)}</Badge> },
    { key: "status", header: "Status" }
  ]

  const receberColumns = [
    { key: "data_vencimento", header: "Vencimento", cell: (row: ContaReceber) => formatDate(row.data_vencimento) },
    { key: "descricao", header: "Descrição" },
    { key: "valor", header: "Valor", cell: (row: ContaReceber) => <Badge variant="default">{formatCurrency(row.valor)}</Badge> },
    { key: "status", header: "Status" }
  ]

  return (
    <div>
      <PageHeader title="Financeiro" description="Controle de contas a pagar e receber">
        <div className="flex gap-2">
          <Dialog open={pagarDialogOpen} onOpenChange={setPagarDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Nova Conta a Pagar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Conta a Pagar</DialogTitle></DialogHeader>
              <form onSubmit={handleContaPagarSubmit} className="space-y-4">
                <div><Label>Descrição *</Label><Input value={contaPagarForm.descricao} onChange={(e) => setContaPagarForm({ ...contaPagarForm, descricao: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={contaPagarForm.valor} onChange={(e) => setContaPagarForm({ ...contaPagarForm, valor: e.target.value })} required /></div>
                  <div><Label>Vencimento *</Label><Input type="date" value={contaPagarForm.data_vencimento} onChange={(e) => setContaPagarForm({ ...contaPagarForm, data_vencimento: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Categoria</Label><Input value={contaPagarForm.categoria} onChange={(e) => setContaPagarForm({ ...contaPagarForm, categoria: e.target.value })} /></div>
                  <div><Label>Fornecedor</Label><Input value={contaPagarForm.fornecedor} onChange={(e) => setContaPagarForm({ ...contaPagarForm, fornecedor: e.target.value })} /></div>
                </div>
                <div><Label>Observações</Label><Textarea value={contaPagarForm.observacoes} onChange={(e) => setContaPagarForm({ ...contaPagarForm, observacoes: e.target.value })} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPagarDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={receberDialogOpen} onOpenChange={setReceberDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Conta a Receber</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Conta a Receber</DialogTitle></DialogHeader>
              <form onSubmit={handleContaReceberSubmit} className="space-y-4">
                <div><Label>Descrição *</Label><Input value={contaReceberForm.descricao} onChange={(e) => setContaReceberForm({ ...contaReceberForm, descricao: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={contaReceberForm.valor} onChange={(e) => setContaReceberForm({ ...contaReceberForm, valor: e.target.value })} required /></div>
                  <div><Label>Vencimento *</Label><Input type="date" value={contaReceberForm.data_vencimento} onChange={(e) => setContaReceberForm({ ...contaReceberForm, data_vencimento: e.target.value })} required /></div>
                </div>
                <div><Label>Observações</Label><Textarea value={contaReceberForm.observacoes} onChange={(e) => setContaReceberForm({ ...contaReceberForm, observacoes: e.target.value })} /></div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setReceberDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-600" />A Pagar</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(resumo.totalPagar)}</div>
              <p className="text-xs text-muted-foreground">Contas pendentes</p>
              {resumo.contasVencidas > 0 && <Badge variant="destructive" className="mt-2"><AlertCircle className="h-3 w-3 mr-1" />{resumo.contasVencidas} vencida(s)</Badge>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" />A Receber</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(resumo.totalReceber)}</div>
              <p className="text-xs text-muted-foreground">Valores pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" />Saldo</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumo.totalReceber - resumo.totalPagar >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(Math.abs(resumo.totalReceber - resumo.totalPagar))}
              </div>
              <p className="text-xs text-muted-foreground">{resumo.totalReceber - resumo.totalPagar >= 0 ? "Positivo" : "Negativo"}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pagar">
          <TabsList>
            <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          </TabsList>
          <TabsContent value="pagar">
            <DataTable columns={pagarColumns as any} data={contasPagar as any} loading={loading} emptyMessage="Nenhuma conta a pagar registrada" />
          </TabsContent>
          <TabsContent value="receber">
            <DataTable columns={receberColumns as any} data={contasReceber as any} loading={loading} emptyMessage="Nenhuma conta a receber registrada" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
