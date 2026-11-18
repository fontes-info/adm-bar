"use client";

import { useMemo, useState } from "react";
import type { Dados, FormaPagamento, Produto } from "@/lib/types";
import { brl, lerQtd, lerValor, parseQtd, parseValor, qtd, qtdParaInput, valorParaInput } from "@/lib/format";
import { FORMAS } from "@/lib/movimentos";
import {
  abrirCaixa,
  fecharCaixa,
  lancarCaixa,
  movimentarEstoque,
  registrarVenda,
  resumoSessao,
  salvarProduto,
} from "@/lib/store";
import { Botao, CampoDescricao, CampoSelecao, Campo, Chips, Folha, avisar, cx, tentar } from "./ui";
import { Icone } from "./icone";

function semChave<T>(obj: Record<string, T>, chave: string) {
  const copia = { ...obj };
  delete copia[chave];
  return copia;
}

const OPCOES_FORMA = (Object.keys(FORMAS) as FormaPagamento[]).map((f) => ({ valor: f, rotulo: FORMAS[f] }));

/* ------------------------------------------------------------ produto */

export function FormProduto({
  aberta,
  aoFechar,
  produto,
  categorias,
  aoSalvar,
}: {
  aberta: boolean;
  aoFechar: () => void;
  produto?: Produto;
  categorias: string[];
  aoSalvar?: (id: string) => void;
}) {
  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={produto ? "Editar produto" : "Novo produto"}>
      {aberta && (
        <CorpoProduto key={produto?.id ?? "novo"} produto={produto} categorias={categorias} aoFechar={aoFechar} aoSalvar={aoSalvar} />
      )}
    </Folha>
  );
}

function CorpoProduto({
  produto,
  categorias,
  aoFechar,
  aoSalvar,
}: {
  produto?: Produto;
  categorias: string[];
  aoFechar: () => void;
  aoSalvar?: (id: string) => void;
}) {
  const [f, setF] = useState({
    nome: produto?.nome ?? "",
    categoria: produto?.categoria ?? "",
    unidade: produto?.unidade ?? "un",
    codigo: produto?.codigo ?? "",
    precoVenda: produto ? valorParaInput(produto.precoVenda) : "",
    custo: produto ? valorParaInput(produto.custo) : "",
    estoqueMinimo: produto ? qtdParaInput(produto.estoqueMinimo) : "",
    quantidade: "",
    descricao: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    let id = "";
    const ok = tentar(() => {
      const precoVenda = lerValor(f.precoVenda, "preço de venda");
      const custo = lerValor(f.custo, "custo");
      const estoqueMinimo = lerQtd(f.estoqueMinimo, "estoque mínimo");
      const quantidade = lerQtd(f.quantidade, "estoque inicial");
      id = salvarProduto(
        { nome: f.nome, categoria: f.categoria, unidade: f.unidade, codigo: f.codigo, precoVenda, custo, estoqueMinimo, quantidade },
        produto?.id,
        f.descricao
      );
    }, produto ? "Produto atualizado" : "Produto cadastrado");
    if (ok) {
      aoFechar();
      aoSalvar?.(id);
    }
  };

  const preco = parseValor(f.precoVenda) ?? 0;
  const custo = parseValor(f.custo) ?? 0;
  const margem = preco > 0 && custo > 0 ? ((preco - custo) / preco) * 100 : null;

  return (
    <form onSubmit={salvar} className="space-y-4 pt-2">
      <Campo rotulo="Nome do produto" value={f.nome} onChange={set("nome")} placeholder="Ex.: Cerveja Lata 350ml" required autoFocus={!produto} />
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
        <CampoSelecao
          rotulo="Categoria"
          value={f.categoria}
          onChange={(e) => setF({ ...f, categoria: e.target.value })}
          opcoes={[{ valor: "", rotulo: "Sem categoria" }, ...categorias.map((c) => ({ valor: c, rotulo: c }))]}
          opcional
        />
        <Campo rotulo="Unidade" value={f.unidade} onChange={set("unidade")} placeholder="un, kg, L, cx" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Preço de venda" inputMode="decimal" value={f.precoVenda} onChange={set("precoVenda")} placeholder="0,00" />
        <Campo rotulo="Custo" inputMode="decimal" value={f.custo} onChange={set("custo")} placeholder="0,00" opcional />
      </div>
      {margem !== null && (
        <p className={cx("-mt-2 text-xs", margem >= 0 ? "text-emerald-400" : "text-rose-400")}>
          Margem: {margem.toFixed(1).replace(".", ",")}% · lucro por unidade {brl(preco - custo)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {!produto && (
          <Campo rotulo="Estoque inicial" inputMode="decimal" value={f.quantidade} onChange={set("quantidade")} placeholder="0" />
        )}
        <Campo
          rotulo="Estoque mínimo"
          inputMode="decimal"
          value={f.estoqueMinimo}
          onChange={set("estoqueMinimo")}
          placeholder="0"
          dica="Alerta de estoque baixo"
        />
        <Campo rotulo="Código" value={f.codigo} onChange={set("codigo")} placeholder="SKU / barras" opcional className={produto ? "" : "col-span-2"} />
      </div>
      {produto && (
        <p className="rounded-xl bg-zinc-900 p-3 text-xs text-zinc-400 ring-1 ring-white/5">
          Para alterar a quantidade use <b className="text-zinc-200">Entrada</b>, <b className="text-zinc-200">Saída</b> ou{" "}
          <b className="text-zinc-200">Ajuste</b> na tela do produto — assim tudo fica registrado na linha do tempo.
        </p>
      )}
      <CampoDescricao valor={f.descricao} onChange={(v) => setF({ ...f, descricao: v })} />
      <Botao type="submit" className="w-full" icone="check">
        {produto ? "Salvar alterações" : "Cadastrar produto"}
      </Botao>
    </form>
  );
}

/* ---------------------------------------------------- movimento estoque */

export type TipoEstoque = "entrada" | "saida" | "ajuste";

const TITULO_ESTOQUE: Record<TipoEstoque, string> = {
  entrada: "Entrada de estoque",
  saida: "Saída de estoque",
  ajuste: "Ajustar estoque",
};

export function FormEstoque({
  tipo,
  produto,
  produtos,
  aoFechar,
}: {
  tipo: TipoEstoque | null;
  /** produto fixo; se ausente, mostra seletor */
  produto?: Produto;
  produtos?: Produto[];
  aoFechar: () => void;
}) {
  return (
    <Folha aberta={!!tipo} aoFechar={aoFechar} titulo={tipo ? TITULO_ESTOQUE[tipo] : ""}>
      {tipo && <CorpoEstoque key={tipo + (produto?.id ?? "")} tipo={tipo} produto={produto} produtos={produtos ?? []} aoFechar={aoFechar} />}
    </Folha>
  );
}

function CorpoEstoque({
  tipo,
  produto,
  produtos,
  aoFechar,
}: {
  tipo: TipoEstoque;
  produto?: Produto;
  produtos: Produto[];
  aoFechar: () => void;
}) {
  const [produtoId, setProdutoId] = useState(produto?.id ?? "");
  const [quantidade, setQuantidade] = useState(tipo === "ajuste" && produto ? qtdParaInput(produto.quantidade) : "");
  const [custo, setCusto] = useState("");
  const [descricao, setDescricao] = useState("");
  const p = produto ?? produtos.find((x) => x.id === produtoId);
  const n = parseQtd(quantidade);

  const previsto = p && n !== null ? (tipo === "entrada" ? p.quantidade + n : tipo === "saida" ? p.quantidade - n : n) : null;

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) return avisar("Escolha um produto.", "erro");
    const ok = tentar(
      () =>
        movimentarEstoque(
          p.id,
          tipo,
          lerQtd(quantidade, "quantidade", null),
          descricao,
          custo.trim() ? lerValor(custo, "custo unitário") : undefined
        ),
      "Movimentação registrada"
    );
    if (ok) aoFechar();
  };

  return (
    <form onSubmit={salvar} className="space-y-4 pt-2">
      {!produto && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300" htmlFor="sel-produto">
            Produto
          </label>
          <select
            id="sel-produto"
            value={produtoId}
            onChange={(e) => {
              setProdutoId(e.target.value);
              const novo = produtos.find((x) => x.id === e.target.value);
              if (tipo === "ajuste" && novo) setQuantidade(qtdParaInput(novo.quantidade));
            }}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-base text-zinc-100 outline-none ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-400/70"
          >
            <option value="">Selecione…</option>
            {[...produtos]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome} ({qtd(x.quantidade)} {x.unidade})
                </option>
              ))}
          </select>
        </div>
      )}
      {p && (
        <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 ring-1 ring-white/5">
          <span className="text-sm text-zinc-400">Estoque atual</span>
          <span className="font-semibold tabular-nums text-zinc-100">
            {qtd(p.quantidade)} {p.unidade}
          </span>
        </div>
      )}
      <Campo
        rotulo={tipo === "ajuste" ? "Nova quantidade (contagem real)" : "Quantidade"}
        inputMode="decimal"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        placeholder="0"
        autoFocus
        required
      />
      {tipo === "entrada" && (
        <Campo
          rotulo="Custo unitário desta compra"
          inputMode="decimal"
          value={custo}
          onChange={(e) => setCusto(e.target.value)}
          placeholder={p ? valorParaInput(p.custo) : "0,00"}
          dica="Se informado, atualiza o custo do produto"
          opcional
        />
      )}
      {p && previsto !== null && (
        <p className={cx("text-sm", previsto < 0 ? "text-rose-400" : "text-zinc-400")}>
          Estoque ficará em{" "}
          <b className="tabular-nums text-zinc-100">
            {qtd(previsto)} {p.unidade}
          </b>
          {previsto < 0 && " — insuficiente"}
        </p>
      )}
      <CampoDescricao
        valor={descricao}
        onChange={setDescricao}
        placeholder={
          tipo === "entrada"
            ? "Ex.: compra no fornecedor X, nota 123"
            : tipo === "saida"
              ? "Ex.: quebra, consumo interno, vencido"
              : "Ex.: contagem de fim de mês"
        }
      />
      <Botao type="submit" className="w-full" variante={tipo === "saida" ? "perigo" : "primario"} icone="check">
        Registrar
      </Botao>
    </form>
  );
}

/* -------------------------------------------------------------- venda */

export function FormVenda({ aberta, aoFechar, dados }: { aberta: boolean; aoFechar: () => void; dados: Dados }) {
  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Nova venda">
      {aberta && <CorpoVenda dados={dados} aoFechar={aoFechar} />}
    </Folha>
  );
}

function CorpoVenda({ dados, aoFechar }: { dados: Dados; aoFechar: () => void }) {
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [editando, setEditando] = useState<Record<string, string>>({});
  const [forma, setForma] = useState<FormaPagamento>("dinheiro");
  const [recebido, setRecebido] = useState("");
  const [descricao, setDescricao] = useState("");
  const [etapa, setEtapa] = useState<"itens" | "pagamento">("itens");

  const produtos = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return [...dados.produtos]
      .filter((p) => !t || p.nome.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [busca, dados.produtos]);

  const itens = Object.entries(carrinho)
    .map(([id, q]) => ({ p: dados.produtos.find((x) => x.id === id), q }))
    .filter((i): i is { p: Produto; q: number } => !!i.p && i.q > 0);
  const total = itens.reduce((s, i) => s + Math.round(i.p.precoVenda * i.q), 0);
  const nItens = itens.reduce((s, i) => s + i.q, 0);
  const valorRecebido = parseValor(recebido);
  const troco = valorRecebido !== null ? valorRecebido - total : null;

  const alterar = (p: Produto, delta: number) => {
    const atual = carrinho[p.id] ?? 0;
    const novo = Math.max(0, Math.min(p.quantidade, Math.round((atual + delta) * 1000) / 1000));
    if (atual + delta > p.quantidade) avisar(`Só há ${qtd(p.quantidade)} ${p.unidade} de ${p.nome}.`, "erro");
    setCarrinho({ ...carrinho, [p.id]: novo });
    setEditando((atual) => semChave(atual, p.id));
  };

  const digitar = (p: Produto, texto: string) => {
    setEditando({ ...editando, [p.id]: texto });
    const n = parseQtd(texto);
    if (n === null || n < 0) return;
    if (n > p.quantidade) avisar(`Só há ${qtd(p.quantidade)} ${p.unidade} de ${p.nome}.`, "erro");
    setCarrinho({ ...carrinho, [p.id]: Math.min(n, p.quantidade) });
  };

  const finalizar = () => {
    const ok = tentar(
      () =>
        registrarVenda(
          itens.map((i) => ({ produtoId: i.p.id, quantidade: i.q })),
          forma,
          descricao
        ),
      `Venda de ${brl(total)} registrada`
    );
    if (ok) aoFechar();
  };

  if (!dados.produtos.length)
    return <p className="py-8 text-center text-zinc-400">Cadastre produtos no estoque para poder vender.</p>;

  if (etapa === "pagamento")
    return (
      <div className="space-y-4 pt-2">
        <ul className="divide-y divide-white/5 rounded-xl bg-zinc-900 ring-1 ring-white/5">
          {itens.map(({ p, q }) => (
            <li key={p.id} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-zinc-300">
                {qtd(q)}× {p.nome}
              </span>
              <span className="tabular-nums text-zinc-100">{brl(Math.round(p.precoVenda * q))}</span>
            </li>
          ))}
          <li className="flex justify-between px-4 py-3 font-semibold">
            <span className="text-zinc-200">Total</span>
            <span className="text-lg tabular-nums text-amber-400">{brl(total)}</span>
          </li>
        </ul>
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-300">Forma de pagamento</p>
          <Chips opcoes={OPCOES_FORMA} valor={forma} onChange={setForma} />
        </div>
        {forma === "dinheiro" && (
          <div>
            <Campo rotulo="Valor recebido" inputMode="decimal" value={recebido} onChange={(e) => setRecebido(e.target.value)} placeholder={valorParaInput(total)} opcional />
            {troco !== null && (
              <p className={cx("mt-1.5 text-sm font-medium", troco < 0 ? "text-rose-400" : "text-emerald-400")}>
                {troco < 0 ? `Faltam ${brl(-troco)}` : `Troco: ${brl(troco)}`}
              </p>
            )}
            {recebido.trim() && valorRecebido === null && <p className="mt-1.5 text-sm text-rose-400">Valor inválido</p>}
          </div>
        )}
        <CampoDescricao valor={descricao} onChange={setDescricao} placeholder="Ex.: mesa 4, cliente João" />
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Botao variante="secundario" onClick={() => setEtapa("itens")} icone="voltar">
            Itens
          </Botao>
          <Botao variante="sucesso" onClick={finalizar} icone="check" disabled={forma === "dinheiro" && troco !== null && troco < 0}>
            Finalizar {brl(total)}
          </Botao>
        </div>
      </div>
    );

  return (
    <div className="pt-2">
      <div className="relative mb-3">
        <Icone nome="busca" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto…"
          className="w-full rounded-xl bg-zinc-900 py-3 pl-11 pr-4 text-base text-zinc-100 outline-none ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-400/70"
        />
      </div>
      <ul className="space-y-2">
        {produtos.map((p) => {
          const q = carrinho[p.id] ?? 0;
          const esgotado = p.quantidade <= 0;
          return (
            <li
              key={p.id}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset",
                q > 0 ? "bg-amber-400/10 ring-amber-400/40" : "bg-zinc-900 ring-white/5",
                esgotado && "opacity-50"
              )}
            >
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => !esgotado && alterar(p, 1)} disabled={esgotado}>
                <p className="truncate font-medium text-zinc-100">{p.nome}</p>
                <p className="text-xs text-zinc-400">
                  {brl(p.precoVenda)} · {esgotado ? "sem estoque" : `${qtd(p.quantidade)} ${p.unidade}`}
                </p>
              </button>
              {q > 0 || editando[p.id] !== undefined ? (
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Diminuir" onClick={() => alterar(p, -1)} className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 active:bg-zinc-700">
                    <Icone nome="menos" className="size-4" />
                  </button>
                  <input
                    aria-label={`Quantidade de ${p.nome}`}
                    inputMode="decimal"
                    value={editando[p.id] ?? qtdParaInput(q)}
                    onChange={(e) => digitar(p, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => setEditando((atual) => semChave(atual, p.id))}
                    className="w-14 rounded-lg bg-zinc-950/60 py-2 text-center font-semibold tabular-nums text-zinc-50 outline-none ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-amber-400/70"
                  />
                  <button type="button" aria-label="Aumentar" onClick={() => alterar(p, 1)} className="flex size-10 items-center justify-center rounded-lg bg-amber-400 text-zinc-950 active:bg-amber-500">
                    <Icone nome="mais" className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Adicionar ${p.nome}`}
                  disabled={esgotado}
                  onClick={() => alterar(p, 1)}
                  className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 text-amber-400 active:bg-zinc-700"
                >
                  <Icone nome="mais" className="size-5" />
                </button>
              )}
            </li>
          );
        })}
        {!produtos.length && <li className="py-6 text-center text-sm text-zinc-500">Nenhum produto encontrado.</li>}
      </ul>
      <div className="sticky bottom-0 -mx-4 mt-3 bg-zinc-925 px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3">
        <Botao className="w-full" disabled={!itens.length} onClick={() => setEtapa("pagamento")} icone="carrinho">
          {itens.length ? `${qtd(nItens)} ${nItens === 1 ? "item" : "itens"} · ${brl(total)} — Continuar` : "Selecione os produtos"}
        </Botao>
      </div>
    </div>
  );
}

/* --------------------------------------------------- lançamento caixa */

export type TipoLancamento = "suprimento" | "sangria" | "despesa";

const TITULO_LANC: Record<TipoLancamento, { titulo: string; dica: string }> = {
  suprimento: { titulo: "Suprimento (colocar dinheiro)", dica: "Ex.: troco extra trazido do cofre" },
  sangria: { titulo: "Sangria (retirar dinheiro)", dica: "Ex.: depósito no banco, retirada para o cofre" },
  despesa: { titulo: "Registrar despesa", dica: "Ex.: compra de gelo, pagamento de diarista" },
};

export function FormLancamento({ tipo, aoFechar, dinheiroDisponivel }: { tipo: TipoLancamento | null; aoFechar: () => void; dinheiroDisponivel: number }) {
  return (
    <Folha aberta={!!tipo} aoFechar={aoFechar} titulo={tipo ? TITULO_LANC[tipo].titulo : ""}>
      {tipo && <CorpoLancamento key={tipo} tipo={tipo} aoFechar={aoFechar} dinheiroDisponivel={dinheiroDisponivel} />}
    </Folha>
  );
}

function CorpoLancamento({ tipo, aoFechar, dinheiroDisponivel }: { tipo: TipoLancamento; aoFechar: () => void; dinheiroDisponivel: number }) {
  const [valor, setValor] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("dinheiro");
  const [descricao, setDescricao] = useState("");
  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tentar(() => lancarCaixa(tipo, lerValor(valor, "valor", null), descricao, forma), "Lançamento registrado")) aoFechar();
  };
  return (
    <form onSubmit={salvar} className="space-y-4 pt-2">
      <p className="text-sm text-zinc-400">
        Dinheiro em caixa agora: <b className="tabular-nums text-zinc-100">{brl(dinheiroDisponivel)}</b>
      </p>
      <Campo rotulo="Valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" autoFocus required />
      {tipo === "despesa" && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-300">Pago com</p>
          <Chips opcoes={OPCOES_FORMA} valor={forma} onChange={setForma} />
        </div>
      )}
      <CampoDescricao valor={descricao} onChange={setDescricao} placeholder={TITULO_LANC[tipo].dica} />
      <Botao type="submit" className="w-full" icone="check" variante={tipo === "suprimento" ? "primario" : "perigo"}>
        Registrar
      </Botao>
    </form>
  );
}

/* ------------------------------------------------ abrir / fechar caixa */

export function FormAbrirCaixa({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tentar(() => abrirCaixa(lerValor(valor, "dinheiro inicial"), descricao), "Caixa aberto")) {
      setValor("");
      setDescricao("");
      aoFechar();
    }
  };
  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Abrir caixa">
      <form onSubmit={salvar} className="space-y-4 pt-2">
        <Campo
          rotulo="Dinheiro inicial (troco)"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          dica="Quanto há em dinheiro na gaveta neste momento"
          autoFocus
        />
        <CampoDescricao valor={descricao} onChange={setDescricao} placeholder="Ex.: turno da noite — Maria" />
        <Botao type="submit" className="w-full" icone="cadeadoAberto">
          Abrir caixa
        </Botao>
      </form>
    </Folha>
  );
}

export function FormFecharCaixa({ aberta, aoFechar, dados }: { aberta: boolean; aoFechar: () => void; dados: Dados }) {
  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Fechar caixa">
      {aberta && <CorpoFechar dados={dados} aoFechar={aoFechar} />}
    </Folha>
  );
}

function CorpoFechar({ dados, aoFechar }: { dados: Dados; aoFechar: () => void }) {
  const r = resumoSessao(dados);
  const [contado, setContado] = useState("");
  const [descricao, setDescricao] = useState("");
  const valorContado = parseValor(contado);
  const dif = valorContado !== null ? valorContado - r.dinheiro : null;
  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorContado === null)
      return avisar(contado.trim() ? `Valor inválido: "${contado.trim()}".` : "Informe o valor contado na gaveta.", "erro");
    if (tentar(() => fecharCaixa(valorContado, descricao), "Caixa fechado")) aoFechar();
  };
  const linhas: [string, number][] = [
    ["Saldo inicial", r.sessao?.saldoInicial ?? 0],
    ["Vendas em dinheiro", r.porForma.dinheiro],
    ["Suprimentos", r.suprimentos],
    ["Sangrias", -r.retiradas],
  ];
  return (
    <form onSubmit={salvar} className="space-y-4 pt-2">
      <ul className="divide-y divide-white/5 rounded-xl bg-zinc-900 text-sm ring-1 ring-white/5">
        {linhas.map(([rot, v]) => (
          <li key={rot} className="flex justify-between px-4 py-2.5">
            <span className="text-zinc-400">{rot}</span>
            <span className="tabular-nums text-zinc-200">{brl(v)}</span>
          </li>
        ))}
        <li className="flex justify-between px-4 py-3 font-semibold">
          <span className="text-zinc-200">Esperado em dinheiro</span>
          <span className="tabular-nums text-amber-400">{brl(r.dinheiro)}</span>
        </li>
      </ul>
      <p className="text-xs text-zinc-500">
        Despesas e estornos em dinheiro já estão descontados. Total vendido no turno: {brl(r.vendas - r.estornos)} (
        {r.qtdVendas} vendas).
      </p>
      <Campo rotulo="Dinheiro contado na gaveta" inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="0,00" autoFocus required />
      {dif !== null && (
        <p className={cx("text-sm font-medium", dif === 0 ? "text-emerald-400" : dif > 0 ? "text-sky-400" : "text-rose-400")}>
          {dif === 0 ? "Caixa confere!" : dif > 0 ? `Sobra de ${brl(dif)}` : `Falta de ${brl(-dif)}`}
        </p>
      )}
      <CampoDescricao valor={descricao} onChange={setDescricao} placeholder="Ex.: explicar diferença, observações do turno" />
      <Botao type="submit" className="w-full" icone="cadeado">
        Fechar caixa
      </Botao>
    </form>
  );
}
