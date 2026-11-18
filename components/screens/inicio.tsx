"use client";

import { useState } from "react";
import type { Dados } from "@/lib/types";
import { brl, ehHoje, qtd } from "@/lib/format";
import { resumoSessao } from "@/lib/store";
import { ir } from "@/lib/router";
import { Cartao, Secao, cx } from "../ui";
import { Icone } from "../icone";
import { LinhaDoTempo } from "../linha-do-tempo";
import { FormAbrirCaixa, FormEstoque, FormProduto, FormVenda } from "../formularios";

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function Inicio({ dados }: { dados: Dados }) {
  const [folha, setFolha] = useState<null | "venda" | "entrada" | "produto" | "abrir">(null);
  const fechar = () => setFolha(null);
  const r = resumoSessao(dados);

  const vendasHoje = dados.movimentos.filter((m) => m.tipo === "venda" && ehHoje(m.criadoEm));
  const estornosHoje = dados.movimentos.filter((m) => m.tipo === "estorno" && ehHoje(m.criadoEm));
  const totalHoje =
    vendasHoje.reduce((s, m) => s + (m.valor ?? 0), 0) - estornosHoje.reduce((s, m) => s + (m.valor ?? 0), 0);

  const valorCusto = dados.produtos.reduce((s, p) => s + Math.round(p.custo * p.quantidade), 0);
  const valorVenda = dados.produtos.reduce((s, p) => s + Math.round(p.precoVenda * p.quantidade), 0);
  const baixos = dados.produtos
    .filter((p) => p.quantidade <= p.estoqueMinimo)
    .sort((a, b) => a.quantidade - b.quantidade);

  const acoes = [
    { id: "venda" as const, rotulo: "Nova venda", icone: "carrinho", destaque: true },
    { id: "entrada" as const, rotulo: "Entrada", icone: "setaBaixo" },
    { id: "produto" as const, rotulo: "Produto", icone: "caixaProduto" },
  ];

  return (
    <div className="pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">
            {saudacao()}, {dados.loja.responsavel.split(" ")[0] || "bem-vindo(a)"}
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight text-zinc-50">{dados.loja.nome}</h1>
        </div>
        <button
          type="button"
          onClick={() => ir("/loja")}
          aria-label="Configurações da loja"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-amber-400 ring-1 ring-white/10"
        >
          <Icone nome="loja" />
        </button>
      </div>

      {/* caixa */}
      <button type="button" onClick={() => ir("/caixa")} className="block w-full text-left">
        <Cartao className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-900/40">
          <div className="flex items-center justify-between">
            <span
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                r.sessao ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"
              )}
            >
              <span className={cx("size-1.5 rounded-full", r.sessao ? "bg-emerald-400" : "bg-zinc-500")} />
              {r.sessao ? "Caixa aberto" : "Caixa fechado"}
            </span>
            <Icone nome="direita" className="size-5 text-zinc-600" />
          </div>
          <p className="mt-3 text-sm text-zinc-400">Vendido hoje</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-zinc-50">{brl(totalHoje)}</p>
          <div className="mt-3 flex gap-4 text-sm text-zinc-400">
            <span>
              <b className="text-zinc-200">{vendasHoje.length}</b> vendas
            </span>
            {r.sessao && (
              <span>
                Gaveta: <b className="tabular-nums text-zinc-200">{brl(r.dinheiro)}</b>
              </span>
            )}
          </div>
        </Cartao>
      </button>

      {/* ações rápidas */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {acoes.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setFolha(a.id === "venda" && !r.sessao ? "abrir" : a.id)}
            className={cx(
              "flex flex-col items-center gap-1.5 rounded-2xl py-3.5 text-sm font-medium transition-colors",
              a.destaque
                ? "bg-amber-400 text-zinc-950 active:bg-amber-500"
                : "bg-zinc-900 text-zinc-200 ring-1 ring-inset ring-white/5 active:bg-zinc-800"
            )}
          >
            <Icone nome={a.icone} className="size-6" />
            {a.rotulo}
          </button>
        ))}
      </div>

      {/* estoque */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => ir("/estoque")} className="text-left">
          <Cartao className="h-full">
            <p className="text-xs text-zinc-400">Produtos</p>
            <p className="text-xl font-bold tabular-nums text-zinc-50">{dados.produtos.length}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {qtd(dados.produtos.reduce((s, p) => s + p.quantidade, 0))} unidades em estoque
            </p>
          </Cartao>
        </button>
        <button type="button" onClick={() => ir("/estoque")} className="text-left">
          <Cartao className="h-full">
            <p className="text-xs text-zinc-400">Valor em estoque</p>
            <p className="text-xl font-bold tabular-nums text-zinc-50">{brl(valorCusto)}</p>
            <p className="mt-1 text-xs text-zinc-500">{brl(valorVenda)} a preço de venda</p>
          </Cartao>
        </button>
      </div>

      {baixos.length > 0 && (
        <Secao titulo={`Estoque baixo (${baixos.length})`}>
          <ul className="space-y-2">
            {baixos.slice(0, 5).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => ir(`/produto/${encodeURIComponent(p.id)}`)}
                  className="flex w-full items-center gap-3 rounded-xl bg-rose-500/[0.07] px-3 py-2.5 text-left ring-1 ring-inset ring-rose-500/20"
                >
                  <Icone nome="alerta" className="size-5 shrink-0 text-rose-400" />
                  <span className="min-w-0 flex-1 truncate text-zinc-100">{p.nome}</span>
                  <span className="shrink-0 text-sm tabular-nums text-rose-300">
                    {qtd(p.quantidade)} / mín. {qtd(p.estoqueMinimo)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao
        titulo="Atividade recente"
        acao={
          <button type="button" onClick={() => ir("/historico")} className="text-sm font-medium text-amber-400">
            Ver tudo
          </button>
        }
      >
        <LinhaDoTempo movimentos={dados.movimentos} limite={6} />
      </Secao>

      <FormVenda aberta={folha === "venda"} aoFechar={fechar} dados={dados} />
      <FormAbrirCaixa aberta={folha === "abrir"} aoFechar={fechar} />
      <FormEstoque tipo={folha === "entrada" ? "entrada" : null} produtos={dados.produtos} aoFechar={fechar} />
      <FormProduto aberta={folha === "produto"} aoFechar={fechar} categorias={dados.categorias} />
    </div>
  );
}
