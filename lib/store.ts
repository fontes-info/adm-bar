"use client";

import { useSyncExternalStore } from "react";
import type {
  Dados,
  FormaPagamento,
  ItemMovimento,
  Movimento,
  Produto,
  SessaoCaixa,
  TipoMovimento,
} from "./types";
import { brl, qtd } from "./format";

const CHAVE = "adm-bar:dados";

/* ---------------------------------------------------------------- utils */

export function gerarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      /* contexto inseguro (http) — cai no fallback */
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const agora = () => new Date().toISOString();

const limpa = (s?: string) => {
  const t = (s ?? "").trim();
  return t ? t : undefined;
};

/* ---------------------------------------------------- leitura / escrita */

let cache: Dados | null | undefined;
const ouvintes = new Set<() => void>();

function ler(): Dados | null {
  if (cache === undefined) {
    try {
      const bruto = localStorage.getItem(CHAVE);
      cache = bruto ? validarDados(JSON.parse(bruto)) : null;
    } catch {
      cache = null;
    }
  }
  return cache;
}

function notificar() {
  ouvintes.forEach((o) => o());
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  const aoMudarStorage = (e: StorageEvent) => {
    if (e.key === CHAVE || e.key === null) {
      cache = undefined;
      ouvinte();
    }
  };
  window.addEventListener("storage", aoMudarStorage);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoMudarStorage);
  };
}

function gravar(dados: Dados | null) {
  try {
    if (dados) localStorage.setItem(CHAVE, JSON.stringify(dados));
    else localStorage.removeItem(CHAVE);
  } catch {
    throw new Error(
      "Não foi possível salvar no navegador (armazenamento cheio ou bloqueado). Exporte um backup."
    );
  }
  cache = dados;
  notificar();
}

function atualizar(fn: (d: Dados) => Dados) {
  const atual = ler();
  if (!atual) throw new Error("Nenhuma loja cadastrada.");
  gravar(fn(atual));
}

/**
 * `undefined` = ainda não hidratou (servidor / primeiro render)
 * `null` = navegador sem cadastro
 */
export function useDados(): Dados | null | undefined {
  return useSyncExternalStore(inscrever, ler, () => undefined);
}

function mov(tipo: TipoMovimento, campos: Partial<Movimento> = {}): Movimento {
  const m: Movimento = { id: gerarId(), tipo, criadoEm: agora(), ...campos };
  if (!m.descricao) delete m.descricao;
  return m;
}

/* -------------------------------------------------------- validação */

const num = (v: unknown, padrao = 0) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : padrao;
};
const str = (v: unknown, padrao = "") => (typeof v === "string" ? v : padrao);

const TIPOS_VALIDOS: TipoMovimento[] = [
  "cadastro", "produto_criado", "produto_editado", "produto_excluido", "entrada", "saida", "ajuste",
  "venda", "estorno", "abertura", "fechamento", "suprimento", "sangria", "despesa", "loja_editada", "dados_importados",
];
const FORMAS_VALIDAS: FormaPagamento[] = ["dinheiro", "pix", "debito", "credito", "outro"];

function validarMovimento(bruto: unknown, n: number): Movimento {
  const erro = (motivo: string) => new Error(`Movimentação nº ${n} inválida: ${motivo}.`);
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) throw erro("formato");
  const m = bruto as Record<string, unknown>;
  if (!TIPOS_VALIDOS.includes(m.tipo as TipoMovimento)) throw erro("tipo desconhecido");
  if (typeof m.criadoEm !== "string" || Number.isNaN(Date.parse(m.criadoEm))) throw erro("data");

  const opcStr = (k: string) => {
    if (m[k] === undefined || m[k] === null) return undefined;
    if (typeof m[k] !== "string") throw erro(k);
    return m[k] as string;
  };
  const opcNum = (k: string) => {
    if (m[k] === undefined || m[k] === null) return undefined;
    if (typeof m[k] !== "number" || !Number.isFinite(m[k])) throw erro(k);
    return m[k] as number;
  };

  let itens: ItemMovimento[] | undefined;
  if (m.itens !== undefined && m.itens !== null) {
    if (!Array.isArray(m.itens)) throw erro("itens");
    itens = m.itens.map((it) => {
      const i = it as Record<string, unknown> | null;
      if (!i || typeof i !== "object" || typeof i.produtoId !== "string" || typeof i.nome !== "string") throw erro("itens");
      for (const k of ["quantidade", "precoUnit", "estoqueAntes", "estoqueDepois"])
        if (typeof i[k] !== "number" || !Number.isFinite(i[k])) throw erro(`itens.${k}`);
      return {
        produtoId: i.produtoId,
        nome: i.nome,
        quantidade: i.quantidade as number,
        precoUnit: i.precoUnit as number,
        estoqueAntes: i.estoqueAntes as number,
        estoqueDepois: i.estoqueDepois as number,
      };
    });
  }
  if ((m.tipo === "venda" || m.tipo === "estorno") && !itens) throw erro("venda sem itens");

  let alteracoes: string[] | undefined;
  if (m.alteracoes !== undefined && m.alteracoes !== null) {
    if (!Array.isArray(m.alteracoes) || m.alteracoes.some((a) => typeof a !== "string")) throw erro("alterações");
    alteracoes = m.alteracoes as string[];
  }
  const forma = opcStr("formaPagamento");
  if (forma !== undefined && !FORMAS_VALIDAS.includes(forma as FormaPagamento)) throw erro("forma de pagamento");

  const r: Movimento = {
    id: opcStr("id") || gerarId(),
    tipo: m.tipo as TipoMovimento,
    criadoEm: m.criadoEm,
    descricao: opcStr("descricao"),
    descricaoEditadaEm: opcStr("descricaoEditadaEm"),
    produtoId: opcStr("produtoId"),
    produtoNome: opcStr("produtoNome"),
    quantidade: opcNum("quantidade"),
    estoqueAntes: opcNum("estoqueAntes"),
    estoqueDepois: opcNum("estoqueDepois"),
    itens,
    valor: opcNum("valor"),
    formaPagamento: forma as FormaPagamento | undefined,
    sessaoId: opcStr("sessaoId"),
    refId: opcStr("refId"),
    esperado: opcNum("esperado"),
    contado: opcNum("contado"),
    alteracoes,
  };
  for (const k of Object.keys(r) as (keyof Movimento)[]) if (r[k] === undefined) delete r[k];
  return r;
}

export function validarDados(bruto: unknown): Dados {
  if (!bruto || typeof bruto !== "object") throw new Error("Arquivo inválido.");
  const o = bruto as Record<string, unknown>;
  const loja = o.loja as Record<string, unknown> | undefined;
  if (!loja || typeof loja.nome !== "string" || !loja.nome.trim())
    throw new Error("O arquivo não contém os dados de uma loja.");
  if (!Array.isArray(o.produtos) || !Array.isArray(o.movimentos))
    throw new Error("O arquivo não contém produtos e movimentações.");

  const produtos: Produto[] = o.produtos
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      id: str(p.id) || gerarId(),
      nome: str(p.nome, "Sem nome"),
      categoria: str(p.categoria),
      unidade: str(p.unidade, "un"),
      codigo: str(p.codigo),
      precoVenda: Math.round(num(p.precoVenda)),
      custo: Math.round(num(p.custo)),
      quantidade: num(p.quantidade),
      estoqueMinimo: num(p.estoqueMinimo),
      criadoEm: str(p.criadoEm, agora()),
      atualizadoEm: str(p.atualizadoEm, agora()),
    }));

  const movimentos = o.movimentos.map((m, i) => validarMovimento(m, i + 1));

  const caixa = o.caixa as { sessao?: SessaoCaixa | null } | undefined;
  const sessao =
    caixa?.sessao && typeof caixa.sessao.id === "string"
      ? {
          id: caixa.sessao.id,
          abertoEm: str(caixa.sessao.abertoEm, agora()),
          saldoInicial: Math.round(num(caixa.sessao.saldoInicial)),
        }
      : null;

  return {
    app: "adm-bar",
    versao: 1,
    loja: {
      nome: loja.nome.trim(),
      responsavel: str(loja.responsavel),
      criadoEm: str(loja.criadoEm, agora()),
    },
    produtos,
    movimentos,
    caixa: { sessao },
  };
}

/* ------------------------------------------------------- consultas */

export function resumoSessao(dados: Dados) {
  const sessao = dados.caixa.sessao;
  const porForma: Record<FormaPagamento, number> = {
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    outro: 0,
  };
  let vendas = 0;
  let qtdVendas = 0;
  let suprimentos = 0;
  let retiradas = 0;
  let despesas = 0;
  let estornos = 0;
  let dinheiro = sessao?.saldoInicial ?? 0;

  if (sessao) {
    for (const m of dados.movimentos) {
      if (m.sessaoId !== sessao.id) continue;
      const v = m.valor ?? 0;
      const emDinheiro = (m.formaPagamento ?? "dinheiro") === "dinheiro";
      switch (m.tipo) {
        case "venda":
          vendas += v;
          qtdVendas++;
          porForma[m.formaPagamento ?? "dinheiro"] += v;
          if (emDinheiro) dinheiro += v;
          break;
        case "estorno":
          estornos += v;
          porForma[m.formaPagamento ?? "dinheiro"] -= v;
          if (emDinheiro) dinheiro -= v;
          break;
        case "suprimento":
          suprimentos += v;
          dinheiro += v;
          break;
        case "sangria":
          retiradas += v;
          dinheiro -= v;
          break;
        case "despesa":
          despesas += v;
          if (emDinheiro) dinheiro -= v;
          break;
      }
    }
  }
  return { sessao, porForma, vendas, qtdVendas, suprimentos, retiradas, despesas, estornos, dinheiro };
}

export function movimentosDoProduto(dados: Dados, produtoId: string) {
  return dados.movimentos.filter(
    (m) => m.produtoId === produtoId || m.itens?.some((i) => i.produtoId === produtoId)
  );
}

/* ---------------------------------------------------------- ações */

export function cadastrar(responsavel: string, nomeLoja: string) {
  const r = responsavel.trim();
  const n = nomeLoja.trim();
  if (!r) throw new Error("Informe seu nome.");
  if (!n) throw new Error("Informe o nome da loja.");
  gravar({
    app: "adm-bar",
    versao: 1,
    loja: { nome: n, responsavel: r, criadoEm: agora() },
    produtos: [],
    movimentos: [mov("cadastro", { descricao: `Loja "${n}" cadastrada por ${r}` })],
    caixa: { sessao: null },
  });
}

export function importar(dados: Dados, nomeArquivo?: string) {
  const d = validarDados(dados);
  d.movimentos.push(
    mov("dados_importados", {
      descricao: nomeArquivo ? `Backup importado do arquivo ${nomeArquivo}` : undefined,
      alteracoes: [`${d.produtos.length} produto(s)`, `${d.movimentos.length} movimentação(ões)`],
    })
  );
  gravar(d);
}

export function exportar(): Dados {
  const d = ler();
  if (!d) throw new Error("Nada para exportar.");
  return d;
}

export function apagarTudo() {
  gravar(null);
}

export function atualizarLoja(nome: string, responsavel: string, descricao?: string) {
  const n = nome.trim();
  const r = responsavel.trim();
  if (!n) throw new Error("Informe o nome da loja.");
  atualizar((d) => {
    const alteracoes: string[] = [];
    if (d.loja.nome !== n) alteracoes.push(`Nome: ${d.loja.nome} → ${n}`);
    if (d.loja.responsavel !== r) alteracoes.push(`Responsável: ${d.loja.responsavel || "—"} → ${r || "—"}`);
    if (!alteracoes.length) return d;
    return {
      ...d,
      loja: { ...d.loja, nome: n, responsavel: r },
      movimentos: [...d.movimentos, mov("loja_editada", { descricao: limpa(descricao), alteracoes })],
    };
  });
}

export interface ProdutoInput {
  nome: string;
  categoria: string;
  unidade: string;
  codigo: string;
  precoVenda: number;
  custo: number;
  estoqueMinimo: number;
  quantidade: number;
}

export function salvarProduto(input: ProdutoInput, id?: string, descricao?: string): string {
  const nome = input.nome.trim();
  if (!nome) throw new Error("Informe o nome do produto.");
  const finitos = [input.precoVenda, input.custo, input.quantidade, input.estoqueMinimo].every(Number.isFinite);
  if (!finitos) throw new Error("Há valores inválidos no formulário.");
  if (input.precoVenda < 0 || input.custo < 0) throw new Error("Valores não podem ser negativos.");
  if (input.quantidade < 0 || input.estoqueMinimo < 0) throw new Error("Quantidades não podem ser negativas.");
  const base = {
    nome,
    categoria: input.categoria.trim(),
    unidade: input.unidade.trim() || "un",
    codigo: input.codigo.trim(),
    precoVenda: input.precoVenda,
    custo: input.custo,
    estoqueMinimo: input.estoqueMinimo,
  };
  let novoId = id ?? gerarId();

  atualizar((d) => {
    if (!id) {
      const p: Produto = { ...base, id: novoId, quantidade: input.quantidade, criadoEm: agora(), atualizadoEm: agora() };
      return {
        ...d,
        produtos: [...d.produtos, p],
        movimentos: [
          ...d.movimentos,
          mov("produto_criado", {
            produtoId: p.id,
            produtoNome: p.nome,
            quantidade: p.quantidade,
            estoqueAntes: 0,
            estoqueDepois: p.quantidade,
            descricao: limpa(descricao),
          }),
        ],
      };
    }
    const atual = d.produtos.find((p) => p.id === id);
    if (!atual) throw new Error("Produto não encontrado.");
    novoId = atual.id;
    const alteracoes: string[] = [];
    const cmp = (rotulo: string, a: string, b: string) => a !== b && alteracoes.push(`${rotulo}: ${a || "—"} → ${b || "—"}`);
    cmp("Nome", atual.nome, base.nome);
    cmp("Categoria", atual.categoria, base.categoria);
    cmp("Unidade", atual.unidade, base.unidade);
    cmp("Código", atual.codigo, base.codigo);
    cmp("Preço de venda", brl(atual.precoVenda), brl(base.precoVenda));
    cmp("Custo", brl(atual.custo), brl(base.custo));
    cmp("Estoque mínimo", qtd(atual.estoqueMinimo), qtd(base.estoqueMinimo));
    if (!alteracoes.length && !limpa(descricao)) return d;
    return {
      ...d,
      produtos: d.produtos.map((p) => (p.id === id ? { ...p, ...base, atualizadoEm: agora() } : p)),
      movimentos: [
        ...d.movimentos,
        mov("produto_editado", { produtoId: id, produtoNome: base.nome, alteracoes, descricao: limpa(descricao) }),
      ],
    };
  });
  return novoId;
}

export function excluirProduto(id: string, descricao?: string) {
  atualizar((d) => {
    const p = d.produtos.find((x) => x.id === id);
    if (!p) throw new Error("Produto não encontrado.");
    return {
      ...d,
      produtos: d.produtos.filter((x) => x.id !== id),
      movimentos: [
        ...d.movimentos,
        mov("produto_excluido", {
          produtoId: p.id,
          produtoNome: p.nome,
          estoqueAntes: p.quantidade,
          estoqueDepois: 0,
          descricao: limpa(descricao),
        }),
      ],
    };
  });
}

export function movimentarEstoque(
  produtoId: string,
  tipo: "entrada" | "saida" | "ajuste",
  quantidade: number,
  descricao?: string,
  custoUnit?: number
) {
  if (!Number.isFinite(quantidade) || quantidade < 0 || (tipo !== "ajuste" && quantidade === 0))
    throw new Error("Informe uma quantidade válida.");
  if (custoUnit !== undefined && (!Number.isFinite(custoUnit) || custoUnit < 0))
    throw new Error("O custo unitário não pode ser negativo.");
  atualizar((d) => {
    const p = d.produtos.find((x) => x.id === produtoId);
    if (!p) throw new Error("Produto não encontrado.");
    const antes = p.quantidade;
    let depois = antes;
    if (tipo === "entrada") depois = antes + quantidade;
    if (tipo === "saida") {
      if (quantidade > antes) throw new Error(`Estoque insuficiente (disponível: ${qtd(antes)} ${p.unidade}).`);
      depois = antes - quantidade;
    }
    if (tipo === "ajuste") depois = quantidade;
    depois = Math.round(depois * 1000) / 1000;
    if (tipo === "ajuste" && depois === antes) throw new Error("A quantidade informada é igual à atual.");
    const novoCusto = tipo === "entrada" && custoUnit !== undefined ? custoUnit : p.custo;
    return {
      ...d,
      produtos: d.produtos.map((x) =>
        x.id === produtoId ? { ...x, quantidade: depois, custo: novoCusto, atualizadoEm: agora() } : x
      ),
      movimentos: [
        ...d.movimentos,
        mov(tipo, {
          produtoId,
          produtoNome: p.nome,
          quantidade: tipo === "ajuste" ? Math.abs(depois - antes) : quantidade,
          estoqueAntes: antes,
          estoqueDepois: depois,
          valor: tipo === "entrada" && custoUnit !== undefined ? Math.round(custoUnit * quantidade) : undefined,
          alteracoes: novoCusto !== p.custo ? [`Custo: ${brl(p.custo)} → ${brl(novoCusto)}`] : undefined,
          descricao: limpa(descricao),
        }),
      ],
    };
  });
}

function exigirSessao(d: Dados) {
  if (!d.caixa.sessao) throw new Error("Abra o caixa antes de fazer lançamentos.");
  return d.caixa.sessao;
}

export function abrirCaixa(saldoInicial: number, descricao?: string) {
  if (!Number.isFinite(saldoInicial) || saldoInicial < 0) throw new Error("Saldo inicial inválido.");
  atualizar((d) => {
    if (d.caixa.sessao) throw new Error("O caixa já está aberto.");
    const sessao: SessaoCaixa = { id: gerarId(), abertoEm: agora(), saldoInicial };
    return {
      ...d,
      caixa: { sessao },
      movimentos: [
        ...d.movimentos,
        mov("abertura", { sessaoId: sessao.id, valor: saldoInicial, formaPagamento: "dinheiro", descricao: limpa(descricao) }),
      ],
    };
  });
}

export function fecharCaixa(contado: number, descricao?: string) {
  if (!Number.isFinite(contado) || contado < 0) throw new Error("Valor contado inválido.");
  atualizar((d) => {
    const sessao = exigirSessao(d);
    const r = resumoSessao(d);
    return {
      ...d,
      caixa: { sessao: null },
      movimentos: [
        ...d.movimentos,
        mov("fechamento", {
          sessaoId: sessao.id,
          esperado: r.dinheiro,
          contado,
          valor: r.vendas - r.estornos,
          alteracoes: [
            `Aberto em ${new Date(sessao.abertoEm).toLocaleString("pt-BR")}`,
            `Saldo inicial: ${brl(sessao.saldoInicial)}`,
            `Vendas: ${r.qtdVendas} · ${brl(r.vendas)}`,
            ...(r.estornos ? [`Estornos: ${brl(r.estornos)}`] : []),
            ...(r.suprimentos ? [`Suprimentos: ${brl(r.suprimentos)}`] : []),
            ...(r.retiradas ? [`Sangrias: ${brl(r.retiradas)}`] : []),
            ...(r.despesas ? [`Despesas: ${brl(r.despesas)}`] : []),
            `Dinheiro: ${brl(r.porForma.dinheiro)} · Pix: ${brl(r.porForma.pix)}`,
            `Débito: ${brl(r.porForma.debito)} · Crédito: ${brl(r.porForma.credito)}`,
            ...(r.porForma.outro ? [`Outros: ${brl(r.porForma.outro)}`] : []),
          ],
          descricao: limpa(descricao),
        }),
      ],
    };
  });
}

export function lancarCaixa(
  tipo: "suprimento" | "sangria" | "despesa",
  valor: number,
  descricao?: string,
  forma: FormaPagamento = "dinheiro"
) {
  if (!Number.isFinite(valor) || !(valor > 0)) throw new Error("Informe um valor maior que zero.");
  atualizar((d) => {
    const sessao = exigirSessao(d);
    if (tipo === "sangria" && valor > resumoSessao(d).dinheiro)
      throw new Error("Valor maior que o dinheiro disponível no caixa.");
    return {
      ...d,
      movimentos: [
        ...d.movimentos,
        mov(tipo, {
          sessaoId: sessao.id,
          valor,
          formaPagamento: tipo === "despesa" ? forma : "dinheiro",
          descricao: limpa(descricao),
        }),
      ],
    };
  });
}

export function registrarVenda(
  carrinho: { produtoId: string; quantidade: number }[],
  forma: FormaPagamento,
  descricao?: string
) {
  const itensValidos = carrinho.filter((i) => i.quantidade > 0);
  if (!itensValidos.length) throw new Error("Adicione ao menos um produto.");
  atualizar((d) => {
    const sessao = exigirSessao(d);
    const produtos = d.produtos.map((p) => ({ ...p }));
    const itens: ItemMovimento[] = itensValidos.map((i) => {
      const p = produtos.find((x) => x.id === i.produtoId);
      if (!p) throw new Error("Um dos produtos não existe mais.");
      if (i.quantidade > p.quantidade)
        throw new Error(`Estoque insuficiente de ${p.nome} (disponível: ${qtd(p.quantidade)} ${p.unidade}).`);
      const antes = p.quantidade;
      p.quantidade = Math.round((antes - i.quantidade) * 1000) / 1000;
      p.atualizadoEm = agora();
      return {
        produtoId: p.id,
        nome: p.nome,
        quantidade: i.quantidade,
        precoUnit: p.precoVenda,
        estoqueAntes: antes,
        estoqueDepois: p.quantidade,
      };
    });
    const valor = itens.reduce((s, i) => s + Math.round(i.precoUnit * i.quantidade), 0);
    return {
      ...d,
      produtos,
      movimentos: [
        ...d.movimentos,
        mov("venda", { sessaoId: sessao.id, itens, valor, formaPagamento: forma, descricao: limpa(descricao) }),
      ],
    };
  });
}

export function estornarVenda(vendaId: string, descricao?: string) {
  atualizar((d) => {
    const sessao = exigirSessao(d);
    const venda = d.movimentos.find((m) => m.id === vendaId && m.tipo === "venda");
    if (!venda) throw new Error("Venda não encontrada.");
    if (venda.refId) throw new Error("Esta venda já foi estornada.");
    const estornoId = gerarId();
    const produtos = d.produtos.map((p) => ({ ...p }));
    const itens: ItemMovimento[] = (venda.itens ?? []).map((i) => {
      const p = produtos.find((x) => x.id === i.produtoId);
      if (!p) return { ...i, estoqueAntes: 0, estoqueDepois: 0 };
      const antes = p.quantidade;
      p.quantidade = Math.round((antes + i.quantidade) * 1000) / 1000;
      p.atualizadoEm = agora();
      return { ...i, estoqueAntes: antes, estoqueDepois: p.quantidade };
    });
    return {
      ...d,
      produtos,
      movimentos: [
        ...d.movimentos.map((m) => (m.id === vendaId ? { ...m, refId: estornoId } : m)),
        {
          ...mov("estorno", {
            sessaoId: sessao.id,
            itens,
            valor: venda.valor,
            formaPagamento: venda.formaPagamento,
            refId: vendaId,
            descricao: limpa(descricao),
          }),
          id: estornoId,
        },
      ],
    };
  });
}

export function editarDescricao(movimentoId: string, descricao: string) {
  atualizar((d) => ({
    ...d,
    movimentos: d.movimentos.map((m) => {
      if (m.id !== movimentoId) return m;
      const nova = { ...m, descricao: limpa(descricao), descricaoEditadaEm: agora() };
      if (!nova.descricao) delete nova.descricao;
      return nova;
    }),
  }));
}
