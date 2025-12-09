"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  getSupabaseClient, 
  ProducaoRastreamento, 
  LocalProducao, 
  Produto,
  Insumo,
  ProducaoRastreamentoHistorico 
} from "@/lib/supabase"
import { formatDate, formatDateTime } from "@/lib/format"
import { Plus, ArrowRight, MapPin, Package, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { toast } from "sonner"

const etapas = ["corte", "costura", "revisao", "embalagem", "finalizado"] as const
const statusOptions = ["em_processo", "em_transito", "finalizado"] as const

const getEtapaBadgeColor = (etapa: string) => {
  switch (etapa) {
    case "corte": return "bg-blue-500"
    case "costura": return "bg-purple-500"
    case "revisao": return "bg-yellow-500"
    case "embalagem": return "bg-orange-500"
    case "finalizado": return "bg-green-500"
    default: return "bg-gray-400"
  }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "em_processo": return "bg-blue-600"
    case "em_transito": return "bg-orange-600"
    case "finalizado": return "bg-green-600"
    default: return "bg-gray-500"
  }
}

export default function RastreamentoProducaoPage() {
  const [rastreamentos, setRastreamentos] = useState<ProducaoRastreamento[]>([])
  const [locais, setLocais] = useState<LocalProducao[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [historico, setHistorico] = useState<ProducaoRastreamentoHistorico[]>([])
  const [novaProducaoOpen, setNovaProducaoOpen] = useState(false)
  const [movimentarOpen, setMovimentarOpen] = useState(false)
  const [finalizarOpen, setFinalizarOpen] = useState(false)
  const [selectedRastreamento, setSelectedRastreamento] = useState<ProducaoRastreamento | null>(null)

  const [novaProducaoForm, setNovaProducaoForm] = useState({
    produto_id: "",
    quantidade: "",
    etapa: "corte" as typeof etapas[number],
    local_atual_id: "",
    insumo_origem_id: "",
    observacoes: "",
  })

  const [movimentacaoForm, setMovimentacaoForm] = useState({
    etapa_nova: "" as string,
    local_destino_id: "",
    quantidade_movimentar: "",
    observacoes: "",
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [rastreamentosRes, locaisRes, produtosRes, insumosRes, historicoRes] = await Promise.all([
        supabase
          .from("producao_rastreamento")
          .select(`
            *,
            produto:produtos(*),
            local_atual:locais_producao!producao_rastreamento_local_atual_id_fkey(*),
            local_origem:locais_producao!producao_rastreamento_local_origem_id_fkey(*),
            local_destino:locais_producao!producao_rastreamento_local_destino_id_fkey(*),
            insumo_origem:insumos(*)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("locais_producao")
          .select("*")
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("produtos")
          .select("*")
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("insumos")
          .select("*")
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("producao_rastreamento_historico")
          .select(`
            *,
            local_anterior:locais_producao!producao_rastreamento_historico_local_anterior_id_fkey(*),
            local_novo:locais_producao!producao_rastreamento_historico_local_novo_id_fkey(*)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
      ])

      if (rastreamentosRes.error) throw rastreamentosRes.error
      if (locaisRes.error) throw locaisRes.error
      if (produtosRes.error) throw produtosRes.error
      if (insumosRes.error) throw insumosRes.error

      setRastreamentos(rastreamentosRes.data || [])
      setLocais(locaisRes.data || [])
      setProdutos(produtosRes.data || [])
      setInsumos(insumosRes.data || [])
      setHistorico(historicoRes.data || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    }
  }

  const handleNovaProducao = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!novaProducaoForm.produto_id || !novaProducaoForm.quantidade || !novaProducaoForm.local_atual_id) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      const { error } = await supabase.from("producao_rastreamento").insert([
        {
          produto_id: novaProducaoForm.produto_id,
          quantidade: parseInt(novaProducaoForm.quantidade),
          etapa: novaProducaoForm.etapa,
          local_atual_id: novaProducaoForm.local_atual_id,
          local_origem_id: novaProducaoForm.local_atual_id,
          insumo_origem_id: novaProducaoForm.insumo_origem_id || null,
          status: "em_processo",
          observacoes: novaProducaoForm.observacoes,
        },
      ])

      if (error) throw error

      toast.success("Produção iniciada com sucesso!")
      setNovaProducaoOpen(false)
      setNovaProducaoForm({
        produto_id: "",
        quantidade: "",
        etapa: "corte",
        local_atual_id: "",
        insumo_origem_id: "",
        observacoes: "",
      })
      loadData()
    } catch (error) {
      console.error("Erro ao iniciar produção:", error)
      toast.error("Erro ao iniciar produção")
    }
  }

  const handleMovimentar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRastreamento || !movimentacaoForm.etapa_nova || !movimentacaoForm.local_destino_id || !movimentacaoForm.quantidade_movimentar) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const quantidadeMovimentar = parseInt(movimentacaoForm.quantidade_movimentar)
    
    if (quantidadeMovimentar <= 0) {
      toast.error("Quantidade deve ser maior que zero")
      return
    }

    if (quantidadeMovimentar > selectedRastreamento.quantidade) {
      toast.error(`Quantidade não pode ser maior que ${selectedRastreamento.quantidade}`)
      return
    }

    try {
      // Se movimentar TODA a quantidade
      if (quantidadeMovimentar === selectedRastreamento.quantidade) {
        // Atualizar rastreamento existente
        const { error: updateError } = await supabase
          .from("producao_rastreamento")
          .update({
            etapa: movimentacaoForm.etapa_nova,
            local_destino_id: movimentacaoForm.local_destino_id,
            local_atual_id: movimentacaoForm.local_destino_id,
            status: "em_processo",
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedRastreamento.id)

        if (updateError) throw updateError

        // Registrar histórico
        await supabase.from("producao_rastreamento_historico").insert([{
          rastreamento_id: selectedRastreamento.id,
          etapa_anterior: selectedRastreamento.etapa,
          etapa_nova: movimentacaoForm.etapa_nova,
          local_anterior_id: selectedRastreamento.local_atual_id,
          local_novo_id: movimentacaoForm.local_destino_id,
          quantidade: quantidadeMovimentar,
          observacoes: movimentacaoForm.observacoes,
        }])

        toast.success("Movimentação registrada com sucesso!")
      } else {
        // Se movimentar PARTE da quantidade - DIVIDIR LOTE
        
        // 1. Reduzir quantidade do lote original
        const quantidadeRestante = selectedRastreamento.quantidade - quantidadeMovimentar
        const { error: updateError } = await supabase
          .from("producao_rastreamento")
          .update({
            quantidade: quantidadeRestante,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedRastreamento.id)

        if (updateError) throw updateError

        // 2. Criar NOVO lote com a quantidade movimentada
        const { data: novoLote, error: insertError } = await supabase
          .from("producao_rastreamento")
          .insert([{
            produto_id: selectedRastreamento.produto_id,
            quantidade: quantidadeMovimentar,
            etapa: movimentacaoForm.etapa_nova,
            local_origem_id: selectedRastreamento.local_atual_id,
            local_destino_id: movimentacaoForm.local_destino_id,
            local_atual_id: movimentacaoForm.local_destino_id,
            status: "em_processo",
            insumo_origem_id: selectedRastreamento.insumo_origem_id,
            observacoes: `Dividido do lote original - ${movimentacaoForm.observacoes}`,
          }])
          .select()
          .single()

        if (insertError) throw insertError

        // 3. Registrar histórico do lote ORIGINAL
        await supabase.from("producao_rastreamento_historico").insert([{
          rastreamento_id: selectedRastreamento.id,
          etapa_anterior: selectedRastreamento.etapa,
          etapa_nova: selectedRastreamento.etapa,
          local_anterior_id: selectedRastreamento.local_atual_id,
          local_novo_id: selectedRastreamento.local_atual_id,
          quantidade: quantidadeRestante,
          observacoes: `Lote dividido: ${quantidadeMovimentar} pares movimentados para ${movimentacaoForm.etapa_nova}`,
        }])

        // 4. Registrar histórico do NOVO lote
        await supabase.from("producao_rastreamento_historico").insert([{
          rastreamento_id: novoLote.id,
          etapa_anterior: selectedRastreamento.etapa,
          etapa_nova: movimentacaoForm.etapa_nova,
          local_anterior_id: selectedRastreamento.local_atual_id,
          local_novo_id: movimentacaoForm.local_destino_id,
          quantidade: quantidadeMovimentar,
          observacoes: `Lote criado por divisão - ${movimentacaoForm.observacoes}`,
        }])

        toast.success(`Lote dividido! ${quantidadeMovimentar} pares movimentados, ${quantidadeRestante} pares permanecem no local original.`)
      }

      setMovimentarOpen(false)
      setMovimentacaoForm({
        etapa_nova: "",
        local_destino_id: "",
        quantidade_movimentar: "",
        observacoes: "",
      })
      setSelectedRastreamento(null)
      loadData()
    } catch (error) {
      console.error("Erro ao movimentar produção:", error)
      toast.error("Erro ao movimentar produção")
    }
  }

  const handleFinalizar = async () => {
    if (!selectedRastreamento) return

    try {
      // Atualizar rastreamento para finalizado
      const { error: updateError } = await supabase
        .from("producao_rastreamento")
        .update({
          etapa: "finalizado",
          status: "finalizado",
          data_finalizacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRastreamento.id)

      if (updateError) throw updateError

      // Dar entrada no estoque de produtos
      const { data: estoqueExistente } = await supabase
        .from("estoque_produtos")
        .select("*")
        .eq("produto_id", selectedRastreamento.produto_id)
        .single()

      if (estoqueExistente) {
        // Atualizar quantidade
        const { error: estoqueError } = await supabase
          .from("estoque_produtos")
          .update({
            quantidade: estoqueExistente.quantidade + selectedRastreamento.quantidade,
            updated_at: new Date().toISOString(),
          })
          .eq("id", estoqueExistente.id)

        if (estoqueError) throw estoqueError
      } else {
        // Criar novo registro de estoque
        const { error: estoqueError } = await supabase
          .from("estoque_produtos")
          .insert([
            {
              produto_id: selectedRastreamento.produto_id,
              quantidade: selectedRastreamento.quantidade,
            },
          ])

        if (estoqueError) throw estoqueError
      }

      // Registrar movimentação de estoque
      await supabase.from("estoque_produto_movimentacoes").insert([
        {
          produto_id: selectedRastreamento.produto_id,
          tipo: "entrada",
          quantidade: selectedRastreamento.quantidade,
          quantidade_anterior: estoqueExistente?.quantidade || 0,
          quantidade_posterior: (estoqueExistente?.quantidade || 0) + selectedRastreamento.quantidade,
          motivo: `Finalização de produção - ${selectedRastreamento.produto?.nome}`,
          referencia_id: selectedRastreamento.id,
          referencia_tipo: "producao_rastreamento",
        },
      ])

      // Registrar histórico
      await supabase.from("producao_rastreamento_historico").insert([
        {
          rastreamento_id: selectedRastreamento.id,
          etapa_anterior: selectedRastreamento.etapa,
          etapa_nova: "finalizado",
          local_anterior_id: selectedRastreamento.local_atual_id,
          local_novo_id: selectedRastreamento.local_atual_id,
          quantidade: selectedRastreamento.quantidade,
          observacoes: "Produção finalizada e adicionada ao estoque",
        },
      ])

      toast.success(`${selectedRastreamento.quantidade} unidades adicionadas ao estoque!`)
      setFinalizarOpen(false)
      setSelectedRastreamento(null)
      loadData()
    } catch (error) {
      console.error("Erro ao finalizar produção:", error)
      toast.error("Erro ao finalizar produção")
    }
  }

  // Estatísticas
  const totalEmProcesso = rastreamentos.filter((r) => r.status === "em_processo").length
  const totalEmTransito = rastreamentos.filter((r) => r.status === "em_transito").length
  const totalFinalizado = rastreamentos.filter((r) => r.status === "finalizado").length

  const rastreamentosColumns = [
    { key: "produto_nome", header: "Produto" },
    { key: "quantidade", header: "Quantidade" },
    { key: "etapa", header: "Etapa" },
    { key: "local_atual", header: "Local Atual" },
    { key: "status", header: "Status" },
    { key: "data_inicio", header: "Data Início" },
    { key: "actions", header: "Ações" },
  ]

  const rastreamentosData = rastreamentos
    .filter((r) => r.status !== "finalizado")
    .map((rastreamento) => ({
      ...rastreamento,
      produto_nome: rastreamento.produto?.nome || "N/A",
      quantidade: `${rastreamento.quantidade} ${rastreamento.produto?.unidade || ""}`,
      etapa: <Badge className={getEtapaBadgeColor(rastreamento.etapa)}>{rastreamento.etapa}</Badge>,
      local_atual: rastreamento.local_atual?.nome || "N/A",
      status: <Badge className={getStatusBadgeColor(rastreamento.status)}>{rastreamento.status}</Badge>,
      data_inicio: formatDate(rastreamento.data_inicio),
      actions: (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRastreamento(rastreamento)
              setMovimentacaoForm({
                etapa_nova: "",
                local_destino_id: "",
                quantidade_movimentar: rastreamento.quantidade.toString(),
                observacoes: "",
              })
              setMovimentarOpen(true)
            }}
            disabled={rastreamento.status === "finalizado"}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Movimentar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedRastreamento(rastreamento)
              setFinalizarOpen(true)
            }}
            disabled={rastreamento.status === "finalizado" || rastreamento.etapa === "finalizado"}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Finalizar
          </Button>
        </div>
      ),
    }))

  const historicoColumns = [
    { key: "data", header: "Data" },
    { key: "etapa_fluxo", header: "Movimentação" },
    { key: "local_fluxo", header: "Local" },
    { key: "quantidade", header: "Quantidade" },
    { key: "observacoes", header: "Observações" },
  ]

  const historicoData = historico.map((h) => ({
    ...h,
    data: formatDateTime(h.created_at),
    etapa_fluxo: `${h.etapa_anterior || "Início"} → ${h.etapa_nova}`,
    local_fluxo: h.local_anterior && h.local_novo 
      ? `${h.local_anterior.nome} → ${h.local_novo.nome}`
      : h.local_novo?.nome || "N/A",
    quantidade: h.quantidade,
    observacoes: h.observacoes || "-",
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Rastreamento de Produção" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em Processo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmProcesso}</div>
            <p className="text-xs text-muted-foreground mt-1">produções ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Em Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmTransito}</div>
            <p className="text-xs text-muted-foreground mt-1">em movimentação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Finalizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFinalizado}</div>
            <p className="text-xs text-muted-foreground mt-1">concluídos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="producao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="producao">Produção Ativa</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="producao" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovaProducaoOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Produção
            </Button>
          </div>

          <DataTable columns={rastreamentosColumns as any} data={rastreamentosData as any} />
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <DataTable columns={historicoColumns as any} data={historicoData as any} />
        </TabsContent>
      </Tabs>

      {/* Dialog Nova Produção */}
      <Dialog open={novaProducaoOpen} onOpenChange={setNovaProducaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Nova Produção</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovaProducao} className="space-y-4">
            <div>
              <Label htmlFor="produto">Produto</Label>
              <Select value={novaProducaoForm.produto_id} onValueChange={(value) => setNovaProducaoForm({ ...novaProducaoForm, produto_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                value={novaProducaoForm.quantidade}
                onChange={(e) => setNovaProducaoForm({ ...novaProducaoForm, quantidade: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="etapa">Etapa Inicial</Label>
              <Select value={novaProducaoForm.etapa} onValueChange={(value: typeof etapas[number]) => setNovaProducaoForm({ ...novaProducaoForm, etapa: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {etapas.filter(e => e !== "finalizado").map((etapa) => (
                    <SelectItem key={etapa} value={etapa}>
                      {etapa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="local">Local</Label>
              <Select value={novaProducaoForm.local_atual_id} onValueChange={(value) => setNovaProducaoForm({ ...novaProducaoForm, local_atual_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {locais.map((local) => (
                    <SelectItem key={local.id} value={local.id}>
                      {local.nome} ({local.tipo === "unidade_propria" ? "Própria" : "Terceiro"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="insumo">Insumo de Origem (Opcional)</Label>
              <Select value={novaProducaoForm.insumo_origem_id || undefined} onValueChange={(value) => setNovaProducaoForm({ ...novaProducaoForm, insumo_origem_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum - Selecione se desejar" />
                </SelectTrigger>
                <SelectContent>
                  {insumos.map((insumo) => (
                    <SelectItem key={insumo.id} value={insumo.id}>
                      {insumo.nome} ({insumo.cor_variacao || "sem cor"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={novaProducaoForm.observacoes}
                onChange={(e) => setNovaProducaoForm({ ...novaProducaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNovaProducaoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Iniciar Produção</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Movimentar Produção */}
      <Dialog open={movimentarOpen} onOpenChange={setMovimentarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Produção</DialogTitle>
          </DialogHeader>
          {selectedRastreamento && (
            <form onSubmit={handleMovimentar} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Produto:</strong> {selectedRastreamento.produto?.nome}
                </p>
                <p className="text-sm">
                  <strong>Quantidade:</strong> {selectedRastreamento.quantidade}
                </p>
                <p className="text-sm">
                  <strong>Etapa Atual:</strong> {selectedRastreamento.etapa}
                </p>
                <p className="text-sm">
                  <strong>Local Atual:</strong> {selectedRastreamento.local_atual?.nome}
                </p>
              </div>

              <div>
                <Label htmlFor="etapa_nova">Nova Etapa</Label>
                <Select value={movimentacaoForm.etapa_nova} onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, etapa_nova: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a nova etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.filter(e => e !== "finalizado").map((etapa) => (
                      <SelectItem key={etapa} value={etapa}>
                        {etapa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="local_destino">Local de Destino</Label>
                <Select value={movimentacaoForm.local_destino_id} onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, local_destino_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locais.map((local) => (
                      <SelectItem key={local.id} value={local.id}>
                        {local.nome} ({local.tipo === "unidade_propria" ? "Própria" : "Terceiro"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantidade_movimentar">Quantidade a Movimentar</Label>
                <Input
                  id="quantidade_movimentar"
                  type="number"
                  min="1"
                  max={selectedRastreamento.quantidade}
                  value={movimentacaoForm.quantidade_movimentar}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, quantidade_movimentar: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total disponível: {selectedRastreamento.quantidade} {selectedRastreamento.produto?.unidade || "unidades"}
                </p>
                {movimentacaoForm.quantidade_movimentar && parseInt(movimentacaoForm.quantidade_movimentar) < selectedRastreamento.quantidade && (
                  <p className="text-xs text-blue-600 mt-1">
                    ⚠️ Lote será dividido: {movimentacaoForm.quantidade_movimentar} serão movimentados, {selectedRastreamento.quantidade - parseInt(movimentacaoForm.quantidade_movimentar)} permanecerão no local atual
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="obs_mov">Observações</Label>
                <Textarea
                  id="obs_mov"
                  value={movimentacaoForm.observacoes}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMovimentarOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Movimentar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Finalizar Produção */}
      <Dialog open={finalizarOpen} onOpenChange={setFinalizarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Produção</DialogTitle>
          </DialogHeader>
          {selectedRastreamento && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Produto:</strong> {selectedRastreamento.produto?.nome}
                </p>
                <p className="text-sm">
                  <strong>Quantidade:</strong> {selectedRastreamento.quantidade}
                </p>
                <p className="text-sm">
                  <strong>Etapa Atual:</strong> {selectedRastreamento.etapa}
                </p>
                <p className="text-sm">
                  <strong>Local Atual:</strong> {selectedRastreamento.local_atual?.nome}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Atenção:</strong> Ao finalizar, esta produção será marcada como concluída e{" "}
                  <strong>{selectedRastreamento.quantidade} unidades</strong> serão adicionadas ao estoque de produtos.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFinalizarOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleFinalizar}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Finalização
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
