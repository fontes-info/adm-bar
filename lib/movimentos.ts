import type { FormaPagamento, Movimento, TipoMovimento } from "./types";
import { brl, qtd } from "./format";

export type Cor = "emerald" | "rose" | "sky" | "amber" | "violet" | "zinc" | "orange";
export type Grupo = "estoque" | "caixa" | "sistema";

export const CORES: Record<Cor, { bolha: string; texto: string }> = {
  emerald: { bolha: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30", texto: "text-emerald-400" },
  rose: { bolha: "bg-rose-500/15 text-rose-400 ring-rose-500/30", texto: "text-rose-400" },
  sky: { bolha: "bg-sky-500/15 text-sky-400 ring-sky-500/30", texto: "text-sky-400" },
  amber: { bolha: "bg-amber-500/15 text-amber-400 ring-amber-500/30", texto: "text-amber-400" },
  violet: { bolha: "bg-violet-500/15 text-violet-400 ring-violet-500/30", texto: "text-violet-400" },
  orange: { bolha: "bg-orange-500/15 text-orange-400 ring-orange-500/30", texto: "text-orange-400" },
  zinc: { bolha: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30", texto: "text-zinc-300" },
};

export const TIPOS: Record<TipoMovimento, { rotulo: string; cor: Cor; grupo: Grupo; icone: string }> = {
  cadastro: { rotulo: "Loja cadastrada", cor: "violet", grupo: "sistema", icone: "loja" },
  loja_editada: { rotulo: "Dados da loja alterados", cor: "violet", grupo: "sistema", icone: "loja" },
  dados_importados: { rotulo: "Backup importado", cor: "violet", grupo: "sistema", icone: "importar" },
  produto_criado: { rotulo: "Produto cadastrado", cor: "sky", grupo: "estoque", icone: "caixaProduto" },
  produto_editado: { rotulo: "Produto editado", cor: "sky", grupo: "estoque", icone: "lapis" },
  produto_excluido: { rotulo: "Produto excluído", cor: "rose", grupo: "estoque", icone: "lixo" },
  entrada: { rotulo: "Entrada de estoque", cor: "emerald", grupo: "estoque", icone: "setaBaixo" },
  saida: { rotulo: "Saída de estoque", cor: "orange", grupo: "estoque", icone: "setaCima" },
  ajuste: { rotulo: "Ajuste de estoque", cor: "amber", grupo: "estoque", icone: "ajuste" },
  venda: { rotulo: "Venda", cor: "emerald", grupo: "caixa", icone: "carrinho" },
  estorno: { rotulo: "Estorno de venda", cor: "rose", grupo: "caixa", icone: "desfazer" },
  abertura: { rotulo: "Abertura de caixa", cor: "sky", grupo: "caixa", icone: "cadeadoAberto" },
  fechamento: { rotulo: "Fechamento de caixa", cor: "zinc", grupo: "caixa", icone: "cadeado" },
  suprimento: { rotulo: "Suprimento (reforço)", cor: "emerald", grupo: "caixa", icone: "mais" },
  sangria: { rotulo: "Sangria (retirada)", cor: "orange", grupo: "caixa", icone: "menos" },
  despesa: { rotulo: "Despesa", cor: "rose", grupo: "caixa", icone: "recibo" },
};

export const FORMAS: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  outro: "Outro",
};

/** efeito no caixa: +1 entra dinheiro, -1 sai, 0 neutro */
export function sinalCaixa(t: TipoMovimento) {
  if (t === "venda" || t === "suprimento") return 1;
  if (t === "estorno" || t === "sangria" || t === "despesa") return -1;
  return 0;
}

export function resumoMovimento(m: Movimento, produtoId?: string): string {
  switch (m.tipo) {
    case "venda":
    case "estorno": {
      const itens = m.itens ?? [];
      if (produtoId) {
        const i = itens.find((x) => x.produtoId === produtoId);
        if (i) return `${qtd(i.quantidade)} × ${brl(i.precoUnit)} · estoque ${qtd(i.estoqueAntes)} → ${qtd(i.estoqueDepois)}`;
      }
      const nomes = itens.map((i) => `${qtd(i.quantidade)}× ${i.nome}`).join(", ");
      return `${nomes}${m.formaPagamento ? ` · ${FORMAS[m.formaPagamento]}` : ""}`;
    }
    case "entrada":
    case "saida":
    case "ajuste":
      return `${m.produtoNome} · ${qtd(m.estoqueAntes ?? 0)} → ${qtd(m.estoqueDepois ?? 0)}`;
    case "produto_criado":
      return `${m.produtoNome} · estoque inicial ${qtd(m.estoqueDepois ?? 0)}`;
    case "produto_editado":
      return `${m.produtoNome}${m.alteracoes?.length ? ` · ${m.alteracoes.length} alteração(ões)` : ""}`;
    case "produto_excluido":
      return `${m.produtoNome}`;
    case "abertura":
      return `Saldo inicial ${brl(m.valor ?? 0)}`;
    case "fechamento": {
      const dif = (m.contado ?? 0) - (m.esperado ?? 0);
      return `Contado ${brl(m.contado ?? 0)}${dif ? ` · diferença ${dif > 0 ? "+" : ""}${brl(dif)}` : " · sem diferença"}`;
    }
    case "despesa":
      return m.formaPagamento ? FORMAS[m.formaPagamento] : "";
    case "loja_editada":
    case "dados_importados":
      return m.alteracoes?.join(" · ") ?? "";
    default:
      return "";
  }
}
