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
import { getSupabaseClient, VictorCompraCouro, VictorProducao, Produto, CustoProducao, VictorCustoProducao } from "@/lib/supabase"
import { formatCurrency, formatDate, formatCurrencyWithDecimals } from "@/lib/format"
import { Plus, Pencil, Package, Calculator } from "lucide-react"
import { toast } from "sonner"

const tiposCouro = ["Raspa", "Vaqueta"]
const classesCouro = ["AB", "CD", "Sotocrosta", "Bahia"]
const situacoes = ["Cortando", "Costurando", "Pronto", "Enviado", "Entregue"] as const
const unidades = ["Pares", "Dúzias", "Unidades"]

const getSituacaoBadgeColor = (situacao: string) => {
  switch (situacao) {
    case "Cortando":
      return "bg-blue-500"
    case "Costurando":
      return "bg-purple-500"
    case "Pronto":
      return "bg-green-500"
    case "Enviado":
      return "bg-orange-500"
    case "Entregue":
      return "bg-gray-500"
    default:
      return "bg-gray-400"
  }
}

export default function VictorLuvasPage() {
  const [compras, setCompras] = useState<VictorCompraCouro[]>([])
  const [producoes, setProducoes] = useState<VictorProducao[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [custos, setCustos] = useState<VictorCustoProducao[]>([])
  const [compraDialogOpen, setCompraDialogOpen] = useState(false)
  const [producaoDialogOpen, setProducaoDialogOpen] = useState(false)
  const [editCompraDialogOpen, setEditCompraDialogOpen] = useState(false)
  const [editProducaoDialogOpen, setEditProducaoDialogOpen] = useState(false)
  const [editCustoDialogOpen, setEditCustoDialogOpen] = useState(false)
  const [editCustoForm, setEditCustoForm] = useState<VictorCustoProducao | null>(null)
  const [custoForm, setCustoForm] = useState({
    compraId: "",
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

  const [compraForm, setCompraForm] = useState({
    data: new Date().toISOString().split("T")[0],
    quantidade_metros: "",
    tipo_couro: "",
    classe_couro: "",
    preco_couro: "",
  })

  const [editCompraForm, setEditCompraForm] = useState<VictorCompraCouro | null>(null)

  const [producaoForm, setProducaoForm] = useState({
    compra_id: "",
    quantidade: "",
    unidade: "",
    tipo_luva: "",
    rendimento: "",
    custo: "",
    situacao: "Cortando" as typeof situacoes[number],
  })

  const [editProducaoForm, setEditProducaoForm] = useState<VictorProducao | null>(null)

  const supabase = getSupabaseClient()

  useEffect(() => {
    loadCompras()
    loadProducoes()
    loadProdutos()
    loadCustos()
  }, [])

  // Calcular custo automaticamente quando selecionar compra
  useEffect(() => {
    if (producaoForm.compra_id) {
      const compra = compras.find(c => c.id === producaoForm.compra_id)
      if (compra) {
        const custoCalculado = (compra.preco_couro / 4.06).toFixed(2)
        setProducaoForm(prev => ({ ...prev, custo: custoCalculado }))
      }
    }
  }, [producaoForm.compra_id, compras])

  // Calcular rendimento automaticamente quando preencher quantidade
  useEffect(() => {
    if (producaoForm.quantidade && producaoForm.unidade) {
      const quantidade = parseInt(producaoForm.quantidade)
      const rendimentoCalculado = (quantidade / 4.06).toFixed(2)
      setProducaoForm(prev => ({ ...prev, rendimento: rendimentoCalculado }))
    }
  }, [producaoForm.quantidade, producaoForm.unidade])

  // Calcular custo no formulário de edição
  useEffect(() => {
    if (editProducaoForm?.compra_id) {
      const compra = compras.find(c => c.id === editProducaoForm.compra_id)
      if (compra) {
        const custoCalculado = (compra.preco_couro / 4.06)
        setEditProducaoForm(prev => prev ? { ...prev, custo: custoCalculado } : null)
      }
    }
  }, [editProducaoForm?.compra_id, compras])

  // Calcular rendimento no formulário de edição
  useEffect(() => {
    if (editProducaoForm?.quantidade && editProducaoForm?.unidade) {
      const rendimentoCalculado = (editProducaoForm.quantidade / 4.06)
      setEditProducaoForm(prev => prev ? { ...prev, rendimento: rendimentoCalculado } : null)
    }
  }, [editProducaoForm?.quantidade, editProducaoForm?.unidade])

  const loadCompras = async () => {
    const { data, error } = await supabase
      .from("victor_compras_couro")
      .select("*")
      .order("data", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar compras")
      console.error(error)
      return
    }

    setCompras(data || [])
  }

  const loadProducoes = async () => {
    const { data, error } = await supabase
      .from("victor_producao")
      .select(`
        *,
        compra:victor_compras_couro(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar produções")
      console.error(error)
      return
    }

    setProducoes(data || [])
  }

  const loadProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("nome")

    if (error) {
      toast.error("Erro ao carregar produtos")
      console.error(error)
      return
    }

    setProdutos(data || [])
  }

  const loadCustos = async () => {
    const { data, error} = await supabase
      .from("victor_custos_producao")
      .select("*, produto:produtos(*)")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar custos")
      console.error(error)
      return
    }

    setCustos(data || [])
  }

  const handleCompraSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!compraForm.data || !compraForm.quantidade_metros || !compraForm.tipo_couro || !compraForm.classe_couro || !compraForm.preco_couro) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const { error } = await supabase.from("victor_compras_couro").insert([
      {
        data: compraForm.data,
        quantidade_metros: parseFloat(compraForm.quantidade_metros),
        tipo_couro: compraForm.tipo_couro,
        classe_couro: compraForm.classe_couro,
        preco_couro: parseFloat(compraForm.preco_couro),
      },
    ])

    if (error) {
      toast.error("Erro ao salvar compra")
      console.error(error)
      return
    }

    toast.success("Compra registrada com sucesso!")
    setCompraDialogOpen(false)
    setCompraForm({
      data: new Date().toISOString().split("T")[0],
      quantidade_metros: "",
      tipo_couro: "",
      classe_couro: "",
      preco_couro: "",
    })
    loadCompras()
  }

  const handleEditCompraSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editCompraForm) return

    const { error } = await supabase
      .from("victor_compras_couro")
      .update({
        data: editCompraForm.data,
        quantidade_metros: editCompraForm.quantidade_metros,
        tipo_couro: editCompraForm.tipo_couro,
        classe_couro: editCompraForm.classe_couro,
        preco_couro: editCompraForm.preco_couro,
      })
      .eq("id", editCompraForm.id)

    if (error) {
      toast.error("Erro ao atualizar compra")
      console.error(error)
      return
    }

    toast.success("Compra atualizada com sucesso!")
    setEditCompraDialogOpen(false)
    setEditCompraForm(null)
    loadCompras()
  }

  const handleProducaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!producaoForm.compra_id || !producaoForm.quantidade || !producaoForm.unidade || !producaoForm.tipo_luva || !producaoForm.situacao) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    const { error } = await supabase.from("victor_producao").insert([
      {
        compra_id: producaoForm.compra_id,
        quantidade: parseInt(producaoForm.quantidade),
        unidade: producaoForm.unidade,
        tipo_luva: producaoForm.tipo_luva,
        rendimento: producaoForm.rendimento ? parseFloat(producaoForm.rendimento) : null,
        custo: producaoForm.custo ? parseFloat(producaoForm.custo) : null,
        situacao: producaoForm.situacao,
      },
    ])

    if (error) {
      toast.error("Erro ao salvar produção")
      console.error(error)
      return
    }

    toast.success("Produção registrada com sucesso!")
    setProducaoDialogOpen(false)
    setProducaoForm({
      compra_id: "",
      quantidade: "",
      unidade: "",
      tipo_luva: "",
      rendimento: "",
      custo: "",
      situacao: "Cortando",
    })
    loadProducoes()
  }

  const handleEditProducaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editProducaoForm) return

    const { error } = await supabase
      .from("victor_producao")
      .update({
        compra_id: editProducaoForm.compra_id,
        quantidade: editProducaoForm.quantidade,
        unidade: editProducaoForm.unidade,
        tipo_luva: editProducaoForm.tipo_luva,
        rendimento: editProducaoForm.rendimento,
        custo: editProducaoForm.custo,
        situacao: editProducaoForm.situacao,
      })
      .eq("id", editProducaoForm.id)

    if (error) {
      toast.error("Erro ao atualizar produção")
      console.error(error)
      return
    }

    toast.success("Produção atualizada com sucesso!")
    setEditProducaoDialogOpen(false)
    setEditProducaoForm(null)
    loadProducoes()
  }

  const calcularCustoTotal = () => {
    const valores = [
      custoForm.custoCouro,
      custoForm.custoCorte,
      custoForm.custoCostura,
      custoForm.custoRevisao,
      custoForm.custoVirarLuva,
      custoForm.custoVies,
      custoForm.custoElastico,
      custoForm.custoLinha,
    ]
    return valores.reduce((total, valor) => {
      const numero = parseFloat(valor) || 0
      return total + numero
    }, 0)
  }

  const handleCustoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!custoForm.produtoId) {
      toast.error("Selecione um produto")
      return
    }

    // Verificar se já existe custo para este produto
    const { data: existente } = await supabase
      .from("victor_custos_producao")
      .select("id")
      .eq("produto_id", custoForm.produtoId)
      .single()

    const custoData = {
      produto_id: custoForm.produtoId,
      custo_couro: parseFloat(custoForm.custoCouro) || 0,
      custo_corte: parseFloat(custoForm.custoCorte) || 0,
      custo_costura: parseFloat(custoForm.custoCostura) || 0,
      custo_revisao: parseFloat(custoForm.custoRevisao) || 0,
      custo_virar_luva: parseFloat(custoForm.custoVirarLuva) || 0,
      custo_vies: parseFloat(custoForm.custoVies) || 0,
      custo_elastico: parseFloat(custoForm.custoElastico) || 0,
      custo_linha: parseFloat(custoForm.custoLinha) || 0,
    }

    let error
    if (existente) {
      const result = await supabase
        .from("victor_custos_producao")
        .update(custoData)
        .eq("id", existente.id)
      error = result.error
    } else {
      const result = await supabase
        .from("victor_custos_producao")
        .insert([custoData])
      error = result.error
    }

    if (error) {
      toast.error("Erro ao salvar custo")
      console.error(error)
      return
    }

    toast.success(existente ? "Custo atualizado com sucesso!" : "Custo registrado com sucesso!")
    setCustoForm({
      compraId: "",
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
    loadCustos()
  }

  const handleEditCustoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editCustoForm) return

    const { error } = await supabase
      .from("victor_custos_producao")
      .update({
        custo_couro: editCustoForm.custo_couro,
        custo_corte: editCustoForm.custo_corte,
        custo_costura: editCustoForm.custo_costura,
        custo_revisao: editCustoForm.custo_revisao,
        custo_virar_luva: editCustoForm.custo_virar_luva,
        custo_vies: editCustoForm.custo_vies,
        custo_elastico: editCustoForm.custo_elastico,
        custo_linha: editCustoForm.custo_linha,
      })
      .eq("id", editCustoForm.id)

    if (error) {
      toast.error("Erro ao atualizar custo")
      console.error(error)
      return
    }

    toast.success("Custo atualizado com sucesso!")
    setEditCustoDialogOpen(false)
    setEditCustoForm(null)
    loadCustos()
  }

  const handleProdutoChange = async (produtoId: string) => {
    setCustoForm({ ...custoForm, produtoId })

    // Carregar custos existentes se houver
    const { data } = await supabase
      .from("victor_custos_producao")
      .select("*")
      .eq("produto_id", produtoId)
      .single()

    if (data) {
      setCustoForm({
        compraId: custoForm.compraId,
        produtoId,
        custoCouro: data.custo_couro.toString(),
        custoCorte: data.custo_corte.toString(),
        custoCostura: data.custo_costura.toString(),
        custoRevisao: data.custo_revisao.toString(),
        custoVirarLuva: data.custo_virar_luva.toString(),
        custoVies: data.custo_vies.toString(),
        custoElastico: data.custo_elastico.toString(),
        custoLinha: data.custo_linha.toString(),
      })
    }
  }

  const handleCompraChange = async (compraId: string) => {
    setCustoForm({ ...custoForm, compraId, custoCouro: "" })

    // Se já tiver produto selecionado, buscar o custo do couro da produção
    if (custoForm.produtoId) {
      const produto = produtos.find(p => p.id === custoForm.produtoId)
      if (produto) {
        const { data: producao } = await supabase
          .from("victor_producao")
          .select("custo")
          .eq("compra_id", compraId)
          .eq("tipo_luva", produto.nome)
          .single()

        if (producao && producao.custo) {
          setCustoForm(prev => ({
            ...prev,
            compraId,
            custoCouro: producao.custo.toString()
          }))
        }
      }
    }
  }

  const handleProdutoChangeWithCouro = async (produtoId: string) => {
    setCustoForm(prev => ({ ...prev, produtoId, custoCouro: "" }))

    // Carregar custos existentes se houver
    const { data } = await supabase
      .from("victor_custos_producao")
      .select("*")
      .eq("produto_id", produtoId)
      .single()

    if (data) {
      setCustoForm(prev => ({
        ...prev,
        compraId: prev.compraId,
        produtoId,
        custoCouro: data.custo_couro.toString(),
        custoCorte: data.custo_corte.toString(),
        custoCostura: data.custo_costura.toString(),
        custoRevisao: data.custo_revisao.toString(),
        custoVirarLuva: data.custo_virar_luva.toString(),
        custoVies: data.custo_vies.toString(),
        custoElastico: data.custo_elastico.toString(),
        custoLinha: data.custo_linha.toString(),
      }))
    } else if (custoForm.compraId) {
      // Se não tiver custos salvos, mas tiver compra selecionada, buscar da produção
      const produto = produtos.find(p => p.id === produtoId)
      if (produto) {
        const { data: producao } = await supabase
          .from("victor_producao")
          .select("custo")
          .eq("compra_id", custoForm.compraId)
          .eq("tipo_luva", produto.nome)
          .single()

        if (producao && producao.custo) {
          setCustoForm(prev => ({
            ...prev,
            produtoId,
            custoCouro: producao.custo.toString()
          }))
        }
      }
    }
  }

  const comprasColumns = [
    { key: "data", header: "Data" },
    { key: "quantidade_metros", header: "Quantidade" },
    { key: "tipo_couro", header: "Tipo de Couro" },
    { key: "classe_couro", header: "Classe" },
    { key: "preco_couro", header: "Preço" },
    { key: "actions", header: "Ações" },
  ]

  const comprasData = compras.map((compra) => ({
    ...compra,
    data: formatDate(compra.data),
    quantidade_metros: `${compra.quantidade_metros} m²`,
    preco_couro: formatCurrency(compra.preco_couro),
    actions: (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditCompraForm(compra)
          setEditCompraDialogOpen(true)
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }))

  const producoesColumns = [
    { key: "compra_info", header: "Compra" },
    { key: "tipo_luva", header: "Tipo de Luva" },
    { key: "quantidade", header: "Quantidade" },
    { key: "rendimento", header: "Rendimento" },
    { key: "custo", header: "Custo" },
    { key: "situacao", header: "Situação" },
    { key: "actions", header: "Ações" },
  ]

  const producoesData = producoes.map((producao) => ({
    ...producao,
    compra_info: producao.compra
      ? `${formatDate(producao.compra.data)} - ${producao.compra.tipo_couro} ${producao.compra.classe_couro}`
      : "N/A",
    quantidade: `${producao.quantidade} ${producao.unidade}`,
    rendimento: producao.rendimento ? `${producao.rendimento} m²` : "N/A",
    custo: producao.custo ? formatCurrency(producao.custo) : "N/A",
    situacao: (
      <Badge className={getSituacaoBadgeColor(producao.situacao)}>
        {producao.situacao}
      </Badge>
    ),
    actions: (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditProducaoForm(producao)
          setEditProducaoDialogOpen(true)
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }))

  // Resumo por situação
  const resumoPorSituacao = situacoes.map((situacao) => {
    const quantidade = producoes.filter((p) => p.situacao === situacao).length
    return { situacao, quantidade }
  })

  const custosColumns = [
    { key: "produto_nome", header: "Produto" },
    { key: "custo_couro", header: "Couro" },
    { key: "custo_corte", header: "Corte" },
    { key: "custo_costura", header: "Costura" },
    { key: "custo_revisao", header: "Revisão" },
    { key: "custo_virar_luva", header: "Virar Luva" },
    { key: "custo_vies", header: "Viés" },
    { key: "custo_elastico", header: "Elástico" },
    { key: "custo_linha", header: "Linha" },
    { key: "custo_total", header: "Total" },
    { key: "actions", header: "Ações" },
  ]

  const custosData = custos.map((custo) => ({
    ...custo,
    produto_nome: custo.produto?.nome || "N/A",
    custo_couro: formatCurrency(custo.custo_couro),
    custo_corte: formatCurrency(custo.custo_corte),
    custo_costura: formatCurrency(custo.custo_costura),
    custo_revisao: formatCurrency(custo.custo_revisao),
    custo_virar_luva: formatCurrency(custo.custo_virar_luva),
    custo_vies: formatCurrencyWithDecimals(custo.custo_vies, 3),
    custo_elastico: formatCurrencyWithDecimals(custo.custo_elastico, 3),
    custo_linha: formatCurrencyWithDecimals(custo.custo_linha, 3),
    custo_total: (
      <Badge className="bg-green-600">{formatCurrency(custo.custo_total)}</Badge>
    ),
    actions: (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditCustoForm(custo)
          setEditCustoDialogOpen(true)
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    ),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Victor Luvas"
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {resumoPorSituacao.map(({ situacao, quantidade }) => (
          <Card key={situacao}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                <Badge className={getSituacaoBadgeColor(situacao)}>
                  {situacao}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quantidade}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {quantidade === 1 ? "produção" : "produções"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="compras" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compras">Compras de Couro</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
        </TabsList>

        <TabsContent value="compras" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCompraDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Compra
            </Button>
          </div>

          <DataTable
            columns={comprasColumns as any}
            data={comprasData as any}
          />
        </TabsContent>

        <TabsContent value="producao" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setProducaoDialogOpen(true)}>
              <Package className="mr-2 h-4 w-4" />
              Nova Produção
            </Button>
          </div>

          <DataTable
            columns={producoesColumns as any}
            data={producoesData as any}
          />
        </TabsContent>

        <TabsContent value="custos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCustoSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="custo_compra">Compra de Couro</Label>
                  <Select value={custoForm.compraId} onValueChange={handleCompraChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {compras.map((compra) => (
                        <SelectItem key={compra.id} value={compra.id}>
                          {formatDate(compra.data)} - {compra.tipo_couro} {compra.classe_couro} ({compra.quantidade_metros}m²)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="custo_produto">Produto</Label>
                  <Select value={custoForm.produtoId} onValueChange={handleProdutoChangeWithCouro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="custo_couro">Couro</Label>
                    <Input
                      id="custo_couro"
                      type="number"
                      step="0.01"
                      value={custoForm.custoCouro}
                      onChange={(e) => setCustoForm({ ...custoForm, custoCouro: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_corte">Corte</Label>
                    <Input
                      id="custo_corte"
                      type="number"
                      step="0.01"
                      value={custoForm.custoCorte}
                      onChange={(e) => setCustoForm({ ...custoForm, custoCorte: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_costura">Costura</Label>
                    <Input
                      id="custo_costura"
                      type="number"
                      step="0.01"
                      value={custoForm.custoCostura}
                      onChange={(e) => setCustoForm({ ...custoForm, custoCostura: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_revisao">Revisão</Label>
                    <Input
                      id="custo_revisao"
                      type="number"
                      step="0.01"
                      value={custoForm.custoRevisao}
                      onChange={(e) => setCustoForm({ ...custoForm, custoRevisao: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_virar">Virar Luva</Label>
                    <Input
                      id="custo_virar"
                      type="number"
                      step="0.01"
                      value={custoForm.custoVirarLuva}
                      onChange={(e) => setCustoForm({ ...custoForm, custoVirarLuva: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_vies">Viés</Label>
                    <Input
                      id="custo_vies"
                      type="number"
                      step="0.001"
                      value={custoForm.custoVies}
                      onChange={(e) => setCustoForm({ ...custoForm, custoVies: e.target.value })}
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_elastico">Elástico</Label>
                    <Input
                      id="custo_elastico"
                      type="number"
                      step="0.001"
                      value={custoForm.custoElastico}
                      onChange={(e) => setCustoForm({ ...custoForm, custoElastico: e.target.value })}
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_linha">Linha</Label>
                    <Input
                      id="custo_linha"
                      type="number"
                      step="0.001"
                      value={custoForm.custoLinha}
                      onChange={(e) => setCustoForm({ ...custoForm, custoLinha: e.target.value })}
                      placeholder="0.000"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Custo Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(calcularCustoTotal())}</p>
                  </div>
                  <Button type="submit">
                    <Calculator className="mr-2 h-4 w-4" />
                    Salvar Custo
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Margem 20%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold">{formatCurrency(calcularCustoTotal() * 1.2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Margem 30%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold">{formatCurrency(calcularCustoTotal() * 1.3)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Margem 40%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold">{formatCurrency(calcularCustoTotal() * 1.4)}</p>
                    </CardContent>
                  </Card>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Custos Cadastrados</h3>
            <DataTable
              columns={custosColumns as any}
              data={custosData as any}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Editar Custo */}
      <Dialog open={editCustoDialogOpen} onOpenChange={setEditCustoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Custo de Produção</DialogTitle>
          </DialogHeader>
          {editCustoForm && (
            <form onSubmit={handleEditCustoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="edit_custo_couro">Couro</Label>
                  <Input
                    id="edit_custo_couro"
                    type="number"
                    step="0.01"
                    value={editCustoForm.custo_couro}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_couro: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_corte">Corte</Label>
                  <Input
                    id="edit_custo_corte"
                    type="number"
                    step="0.01"
                    value={editCustoForm.custo_corte}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_corte: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_costura">Costura</Label>
                  <Input
                    id="edit_custo_costura"
                    type="number"
                    step="0.01"
                    value={editCustoForm.custo_costura}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_costura: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_revisao">Revisão</Label>
                  <Input
                    id="edit_custo_revisao"
                    type="number"
                    step="0.01"
                    value={editCustoForm.custo_revisao}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_revisao: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_virar">Virar Luva</Label>
                  <Input
                    id="edit_custo_virar"
                    type="number"
                    step="0.01"
                    value={editCustoForm.custo_virar_luva}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_virar_luva: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_vies">Viés</Label>
                  <Input
                    id="edit_custo_vies"
                    type="number"
                    step="0.001"
                    value={editCustoForm.custo_vies}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_vies: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_elastico">Elástico</Label>
                  <Input
                    id="edit_custo_elastico"
                    type="number"
                    step="0.001"
                    value={editCustoForm.custo_elastico}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_elastico: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo_linha">Linha</Label>
                  <Input
                    id="edit_custo_linha"
                    type="number"
                    step="0.001"
                    value={editCustoForm.custo_linha}
                    onChange={(e) =>
                      setEditCustoForm({ ...editCustoForm, custo_linha: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditCustoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Atualizar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Compra */}
      <Dialog open={compraDialogOpen} onOpenChange={setCompraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Compra de Couro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompraSubmit} className="space-y-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={compraForm.data}
                onChange={(e) =>
                  setCompraForm({ ...compraForm, data: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="quantidade_metros">Quantidade (m²/Kg)</Label>
              <Input
                id="quantidade_metros"
                type="number"
                step="0.01"
                value={compraForm.quantidade_metros}
                onChange={(e) =>
                  setCompraForm({
                    ...compraForm,
                    quantidade_metros: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="tipo_couro">Tipo de Couro</Label>
              <Select
                value={compraForm.tipo_couro}
                onValueChange={(value) =>
                  setCompraForm({ ...compraForm, tipo_couro: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposCouro.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="classe_couro">Classe do Couro</Label>
              <Select
                value={compraForm.classe_couro}
                onValueChange={(value) =>
                  setCompraForm({ ...compraForm, classe_couro: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classe" />
                </SelectTrigger>
                <SelectContent>
                  {classesCouro.map((classe) => (
                    <SelectItem key={classe} value={classe}>
                      {classe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="preco_couro">Preço</Label>
              <Input
                id="preco_couro"
                type="number"
                step="0.01"
                value={compraForm.preco_couro}
                onChange={(e) =>
                  setCompraForm({ ...compraForm, preco_couro: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompraDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Compra */}
      <Dialog open={editCompraDialogOpen} onOpenChange={setEditCompraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compra de Couro</DialogTitle>
          </DialogHeader>
          {editCompraForm && (
            <form onSubmit={handleEditCompraSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit_data">Data</Label>
                <Input
                  id="edit_data"
                  type="date"
                  value={editCompraForm.data}
                  onChange={(e) =>
                    setEditCompraForm({ ...editCompraForm, data: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_quantidade_metros">Quantidade (m²/Kg)</Label>
                <Input
                  id="edit_quantidade_metros"
                  type="number"
                  step="0.01"
                  value={editCompraForm.quantidade_metros}
                  onChange={(e) =>
                    setEditCompraForm({
                      ...editCompraForm,
                      quantidade_metros: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_tipo_couro">Tipo de Couro</Label>
                <Select
                  value={editCompraForm.tipo_couro}
                  onValueChange={(value) =>
                    setEditCompraForm({ ...editCompraForm, tipo_couro: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCouro.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_classe_couro">Classe do Couro</Label>
                <Select
                  value={editCompraForm.classe_couro}
                  onValueChange={(value) =>
                    setEditCompraForm({ ...editCompraForm, classe_couro: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesCouro.map((classe) => (
                      <SelectItem key={classe} value={classe}>
                        {classe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_preco_couro">Preço</Label>
                <Input
                  id="edit_preco_couro"
                  type="number"
                  step="0.01"
                  value={editCompraForm.preco_couro}
                  onChange={(e) =>
                    setEditCompraForm({
                      ...editCompraForm,
                      preco_couro: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditCompraDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Atualizar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Nova Produção */}
      <Dialog open={producaoDialogOpen} onOpenChange={setProducaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Produção</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProducaoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="compra_id">Compra de Couro</Label>
              <Select
                value={producaoForm.compra_id}
                onValueChange={(value) =>
                  setProducaoForm({ ...producaoForm, compra_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a compra" />
                </SelectTrigger>
                <SelectContent>
                  {compras.map((compra) => (
                    <SelectItem key={compra.id} value={compra.id}>
                      {formatDate(compra.data)} - {compra.tipo_couro} {compra.classe_couro} ({compra.quantidade_metros}m²)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_luva">Tipo de Luva</Label>
              <Select
                value={producaoForm.tipo_luva}
                onValueChange={(value) =>
                  setProducaoForm({ ...producaoForm, tipo_luva: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.nome}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={producaoForm.quantidade}
                  onChange={(e) =>
                    setProducaoForm({
                      ...producaoForm,
                      quantidade: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade</Label>
                <Select
                  value={producaoForm.unidade}
                  onValueChange={(value) =>
                    setProducaoForm({ ...producaoForm, unidade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade} value={unidade}>
                        {unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rendimento">Rendimento m² (calculado)</Label>
                <Input
                  id="rendimento"
                  type="number"
                  step="0.01"
                  value={producaoForm.rendimento}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="custo">Custo (calculado)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={producaoForm.custo}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="situacao">Situação</Label>
              <Select
                value={producaoForm.situacao}
                onValueChange={(value: typeof situacoes[number]) =>
                  setProducaoForm({ ...producaoForm, situacao: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {situacoes.map((situacao) => (
                    <SelectItem key={situacao} value={situacao}>
                      {situacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProducaoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Produção */}
      <Dialog open={editProducaoDialogOpen} onOpenChange={setEditProducaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produção</DialogTitle>
          </DialogHeader>
          {editProducaoForm && (
            <form onSubmit={handleEditProducaoSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit_compra_id">Compra de Couro</Label>
                <Select
                  value={editProducaoForm.compra_id}
                  onValueChange={(value) =>
                    setEditProducaoForm({ ...editProducaoForm, compra_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a compra" />
                  </SelectTrigger>
                  <SelectContent>
                    {compras.map((compra) => (
                      <SelectItem key={compra.id} value={compra.id}>
                        {formatDate(compra.data)} - {compra.tipo_couro} {compra.classe_couro} ({compra.quantidade_metros}m²)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_tipo_luva">Tipo de Luva</Label>
                <Select
                  value={editProducaoForm.tipo_luva}
                  onValueChange={(value) =>
                    setEditProducaoForm({
                      ...editProducaoForm,
                      tipo_luva: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.nome}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_quantidade">Quantidade</Label>
                  <Input
                    id="edit_quantidade"
                    type="number"
                    value={editProducaoForm.quantidade}
                    onChange={(e) =>
                      setEditProducaoForm({
                        ...editProducaoForm,
                        quantidade: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_unidade">Unidade</Label>
                  <Select
                    value={editProducaoForm.unidade}
                    onValueChange={(value) =>
                      setEditProducaoForm({ ...editProducaoForm, unidade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((unidade) => (
                        <SelectItem key={unidade} value={unidade}>
                          {unidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_rendimento">Rendimento m² (calculado)</Label>
                  <Input
                    id="edit_rendimento"
                    type="number"
                    step="0.01"
                    value={editProducaoForm.rendimento || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_custo">Custo (calculado)</Label>
                  <Input
                    id="edit_custo"
                    type="number"
                    step="0.01"
                    value={editProducaoForm.custo || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_situacao">Situação</Label>
                <Select
                  value={editProducaoForm.situacao}
                  onValueChange={(value: typeof situacoes[number]) =>
                    setEditProducaoForm({ ...editProducaoForm, situacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {situacoes.map((situacao) => (
                      <SelectItem key={situacao} value={situacao}>
                        {situacao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProducaoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Atualizar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
