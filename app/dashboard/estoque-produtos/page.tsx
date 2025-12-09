"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabaseClient, type EstoqueProduto, type Produto } from "@/lib/supabase"
import { formatDate } from "@/lib/format"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowUpCircle, ArrowDownCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MovimentacaoProduto {
  id: string
  produto_id: string
  tipo: "entrada" | "saida"
  quantidade: number
  motivo?: string
  created_at: string
  produto?: Produto
}

export default function EstoqueProdutosPage() {
  const { toast } = useToast()
  const [estoque, setEstoque] = useState<EstoqueProduto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoProduto[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    produto_id: "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    motivo: "",
  })

  async function loadData() {
    try {
      const supabase = getSupabaseClient()
      const [estoqueRes, movRes, produtosRes] = await Promise.all([
        supabase.from("estoque_produtos").select("*, produto:produtos(*)").order("produto_id"),
        supabase
          .from("estoque_produto_movimentacoes")
          .select("*, produto:produtos(nome)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("produtos").select("*").eq("ativo", true).order("nome"),
      ])

      if (estoqueRes.error) throw estoqueRes.error
      setEstoque(estoqueRes.data || [])
      setMovimentacoes(movRes.data || [])
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.from("estoque_produto_movimentacoes").insert({
        produto_id: formData.produto_id,
        tipo: formData.tipo,
        quantidade: Number.parseInt(formData.quantidade),
        motivo: formData.motivo || "Ajuste manual",
        referencia_tipo: "ajuste",
      })

      if (error) throw error
      toast({ title: "Movimentação registrada com sucesso" })
      setDialogOpen(false)
      setFormData({ produto_id: "", tipo: "entrada", quantidade: "", motivo: "" })
      loadData()
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error)
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" })
    }
  }

  const estoqueColumns = [
    {
      key: "produto",
      header: "Produto",
      cell: (row: EstoqueProduto) => row.produto?.nome || "-",
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (row: EstoqueProduto) => row.produto?.tipo || "-",
    },
    {
      key: "quantidade",
      header: "Quantidade",
      cell: (row: EstoqueProduto) => (
        <Badge variant={row.quantidade > 0 ? "default" : "destructive"}>{row.quantidade} pares</Badge>
      ),
    },
  ]

  const movimentacoesColumns = [
    {
      key: "created_at",
      header: "Data",
      cell: (row: MovimentacaoProduto) => formatDate(row.created_at),
    },
    {
      key: "produto",
      header: "Produto",
      cell: (row: MovimentacaoProduto) => row.produto?.nome || "-",
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (row: MovimentacaoProduto) => (
        <Badge variant={row.tipo === "entrada" ? "default" : "secondary"}>
          {row.tipo === "entrada" ? (
            <ArrowUpCircle className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownCircle className="h-3 w-3 mr-1" />
          )}
          {row.tipo === "entrada" ? "Entrada" : "Saída"}
        </Badge>
      ),
    },
    { key: "quantidade", header: "Quantidade" },
    { key: "motivo", header: "Motivo" },
  ]

  // Calcular pares completos e diferenças para todos os tipos de luvas
  const calcularParesPorTipo = () => {
    const resultado: Array<{
      tipo: string
      corteVaqueta: number
      corteRaspa: number
      paresCompletos: number
      sobrandoVaqueta: number
      sobrandoRaspa: number
    }> = []

    // Agrupa produtos por tipo (removendo "Corte" do nome para identificar o tipo)
    const tiposMap = new Map<string, { vaqueta: number; raspa: number }>()

    estoque.forEach(e => {
      if (!e.produto?.nome) return

      const nome = e.produto.nome.toLowerCase()
      
      // Identifica se é Vaqueta ou Raspa e extrai o tipo base
      let tipo = ''
      let isVaqueta = false
      let isRaspa = false

      if (nome.includes('corte vaqueta mista')) {
        tipo = 'Mista'
        isVaqueta = true
      } else if (nome.includes('corte raspa mista')) {
        tipo = 'Mista'
        isRaspa = true
      } else if (nome.includes('corte vaqueta')) {
        tipo = 'Vaqueta'
        isVaqueta = true
      } else if (nome.includes('corte raspa')) {
        tipo = 'Raspa'
        isRaspa = true
      }

      if (tipo && (isVaqueta || isRaspa)) {
        if (!tiposMap.has(tipo)) {
          tiposMap.set(tipo, { vaqueta: 0, raspa: 0 })
        }
        const dados = tiposMap.get(tipo)!
        if (isVaqueta) dados.vaqueta = e.quantidade
        if (isRaspa) dados.raspa = e.quantidade
      }
    })

    // Para cada tipo, calcula pares completos e diferenças
    tiposMap.forEach((dados, tipo) => {
      // Se for tipo Vaqueta ou Raspa puro (sem par), não calcula diferença
      if (tipo === 'Vaqueta' || tipo === 'Raspa') {
        if (dados.vaqueta > 0 || dados.raspa > 0) {
          resultado.push({
            tipo,
            corteVaqueta: dados.vaqueta,
            corteRaspa: dados.raspa,
            paresCompletos: 0,
            sobrandoVaqueta: 0,
            sobrandoRaspa: 0
          })
        }
      } else if (dados.vaqueta > 0 || dados.raspa > 0) {
        // Para tipos que precisam de par (Mista, etc)
        const paresCompletos = Math.min(dados.vaqueta, dados.raspa)
        resultado.push({
          tipo,
          corteVaqueta: dados.vaqueta,
          corteRaspa: dados.raspa,
          paresCompletos,
          sobrandoVaqueta: dados.vaqueta - paresCompletos,
          sobrandoRaspa: dados.raspa - paresCompletos
        })
      }
    })

    return resultado
  }

  const analisesPorTipo = calcularParesPorTipo()

  return (
    <div>
      <PageHeader title="Estoque de Produtos" description="Produtos acabados">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Movimentação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Produto *</Label>
                <Select
                  value={formData.produto_id}
                  onValueChange={(value) => setFormData({ ...formData, produto_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: "entrada" | "saida") => setFormData({ ...formData, tipo: value })}
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
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ex: Ajuste de inventário, Produção, Venda..."
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

      {/* Cards de Análise por Tipo de Luva */}
      {analisesPorTipo.length > 0 && (
        <div className="space-y-4 mb-6">
          {analisesPorTipo.map((analise) => (
            <Card key={analise.tipo}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5" />
                  {analise.paresCompletos > 0 
                    ? `Análise de Pares Completos - Luvas ${analise.tipo}`
                    : `Estoque - Corte ${analise.tipo}`
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analise.paresCompletos > 0 ? (
                  // Exibe análise completa para tipos que precisam de par
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Palma (Vaqueta)</p>
                      <p className="text-2xl font-bold">{analise.corteVaqueta} pares</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Dorso e Dedo (Raspa)</p>
                      <p className="text-2xl font-bold">{analise.corteRaspa} pares</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">Pares Completos</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{analise.paresCompletos} pares</p>
                      <p className="text-xs text-muted-foreground mt-1">Prontos para produção</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Sobrando</p>
                      {analise.sobrandoVaqueta > 0 && (
                        <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                          {analise.sobrandoVaqueta} Palma
                        </p>
                      )}
                      {analise.sobrandoRaspa > 0 && (
                        <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                          {analise.sobrandoRaspa} Dorso e Dedo
                        </p>
                      )}
                      {analise.sobrandoVaqueta === 0 && analise.sobrandoRaspa === 0 && (
                        <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                          0 pares
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Exibe apenas quantidade para tipos puros (Vaqueta ou Raspa sem par)
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analise.corteVaqueta > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300 mb-1">Luvas de Vaqueta Completas</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{analise.corteVaqueta} pares</p>
                        <p className="text-xs text-muted-foreground mt-1">Prontos para produção</p>
                      </div>
                    )}
                    {analise.corteRaspa > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300 mb-1">Luvas de Raspa Completas</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{analise.corteRaspa} pares</p>
                        <p className="text-xs text-muted-foreground mt-1">Prontos para produção</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="estoque">
        <TabsList>
          <TabsTrigger value="estoque">Estoque Atual</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="estoque">
          <DataTable
            columns={estoqueColumns}
            data={estoque}
            loading={loading}
            emptyMessage="Nenhum produto em estoque"
          />
        </TabsContent>
        <TabsContent value="historico">
          <DataTable
            columns={movimentacoesColumns}
            data={movimentacoes}
            loading={loading}
            emptyMessage="Nenhuma movimentação registrada"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
