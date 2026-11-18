"use client";

import { useMemo, useState } from "react";
import type { Dados } from "@/lib/types";
import { brl, qtd } from "@/lib/format";
import { ir } from "@/lib/router";
import { Botao, Cabecalho, Chips, Vazio, cx } from "../ui";
import { Icone } from "../icone";
import { FormProduto } from "../formularios";

type Ordem = "nome" | "menor" | "maior" | "recente";

export function Estoque({ dados }: { dados: Dados }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("__todas");
  const [ordem, setOrdem] = useState<Ordem>("nome");
  const [novo, setNovo] = useState(false);

  const categorias = useMemo(
    () => [...new Set(dados.produtos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [dados.produtos]
  );

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const filtrados = dados.produtos.filter((p) => {
      if (categoria === "__baixo" && p.quantidade > p.estoqueMinimo) return false;
      if (categoria !== "__todas" && categoria !== "__baixo" && p.categoria !== categoria) return false;
      return !t || p.nome.toLowerCase().includes(t) || p.codigo.toLowerCase().includes(t);
    });
    return filtrados.sort((a, b) => {
      if (ordem === "menor") return a.quantidade - b.quantidade;
      if (ordem === "maior") return b.quantidade - a.quantidade;
      if (ordem === "recente") return b.atualizadoEm.localeCompare(a.atualizadoEm);
      return a.nome.localeCompare(b.nome);
    });
  }, [dados.produtos, busca, categoria, ordem]);

  const nBaixo = dados.produtos.filter((p) => p.quantidade <= p.estoqueMinimo).length;

  return (
    <div>
      <Cabecalho
        titulo="Estoque"
        subtitulo={`${dados.produtos.length} produto(s)`}
        acoes={
          <select
            aria-label="Ordenar"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="mr-1 rounded-lg bg-zinc-900 px-2 py-2 text-sm text-zinc-300 outline-none ring-1 ring-white/10"
          >
            <option value="nome">A–Z</option>
            <option value="menor">Menor estoque</option>
            <option value="maior">Maior estoque</option>
            <option value="recente">Atualizados</option>
          </select>
        }
      />

      {dados.produtos.length === 0 ? (
        <Vazio icone="caixaProduto" titulo="Nenhum produto ainda" texto="Cadastre seus produtos para controlar o estoque e vender pelo caixa.">
          <Botao icone="mais" onClick={() => setNovo(true)}>
            Cadastrar produto
          </Botao>
        </Vazio>
      ) : (
        <>
          <div className="relative mb-3">
            <Icone nome="busca" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou código…"
              className="w-full rounded-xl bg-zinc-900 py-3 pl-11 pr-4 text-base text-zinc-100 outline-none ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-400/70"
            />
          </div>
          <Chips
            className="mb-3"
            valor={categoria}
            onChange={setCategoria}
            opcoes={[
              { valor: "__todas", rotulo: "Todos" },
              ...(nBaixo ? [{ valor: "__baixo", rotulo: `⚠ Baixo (${nBaixo})` }] : []),
              ...categorias.map((c) => ({ valor: c, rotulo: c })),
            ]}
          />
          <ul className="space-y-2">
            {lista.map((p) => {
              const baixo = p.quantidade <= p.estoqueMinimo;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => ir(`/produto/${encodeURIComponent(p.id)}`)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-zinc-900/80 px-4 py-3 text-left ring-1 ring-inset ring-white/[0.06] transition-colors active:bg-zinc-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-100">{p.nome}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {[p.categoria, brl(p.precoVenda), p.codigo].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div
                      className={cx(
                        "shrink-0 rounded-xl px-3 py-1.5 text-right ring-1 ring-inset",
                        baixo ? "bg-rose-500/10 ring-rose-500/30" : "bg-zinc-800/80 ring-white/5"
                      )}
                    >
                      <p className={cx("text-lg font-bold leading-tight tabular-nums", baixo ? "text-rose-300" : "text-zinc-50")}>
                        {qtd(p.quantidade)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{p.unidade}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {!lista.length && <p className="py-10 text-center text-sm text-zinc-500">Nenhum produto encontrado.</p>}
        </>
      )}

      <button
        type="button"
        aria-label="Novo produto"
        onClick={() => setNovo(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-[max(1rem,calc(50%-15rem))] z-30 flex size-14 items-center justify-center rounded-2xl bg-amber-400 text-zinc-950 shadow-xl shadow-black/40 active:bg-amber-500"
      >
        <Icone nome="mais" className="size-7" />
      </button>

      <FormProduto
        aberta={novo}
        aoFechar={() => setNovo(false)}
        categorias={categorias}
        aoSalvar={(id) => ir(`/produto/${encodeURIComponent(id)}`)}
      />
    </div>
  );
}
