"use client";

import { useState } from "react";
import type { Dados, FormaPagamento } from "@/lib/types";
import { brl, dataCurta } from "@/lib/format";
import { FORMAS } from "@/lib/movimentos";
import { resumoSessao } from "@/lib/store";
import { Botao, Cabecalho, Cartao, Secao, Vazio } from "../ui";
import { Icone } from "../icone";
import { LinhaDoTempo } from "../linha-do-tempo";
import { FormAbrirCaixa, FormFecharCaixa, FormLancamento, FormVenda, type TipoLancamento } from "../formularios";

export function Caixa({ dados }: { dados: Dados }) {
  const [folha, setFolha] = useState<null | "venda" | "abrir" | "fechar">(null);
  const [lanc, setLanc] = useState<TipoLancamento | null>(null);
  const r = resumoSessao(dados);
  const fechar = () => setFolha(null);

  const fechamentos = dados.movimentos.filter((m) => m.tipo === "fechamento");
  const daSessao = r.sessao ? dados.movimentos.filter((m) => m.sessaoId === r.sessao!.id) : [];

  return (
    <div>
      <Cabecalho titulo="Caixa" subtitulo={r.sessao ? `Aberto ${dataCurta(r.sessao.abertoEm)}` : "Fechado"} />

      {!r.sessao ? (
        <>
          <Vazio icone="cadeado" titulo="O caixa está fechado" texto="Abra o caixa informando o dinheiro inicial da gaveta para começar a vender.">
            <Botao icone="cadeadoAberto" onClick={() => setFolha("abrir")}>
              Abrir caixa
            </Botao>
          </Vazio>
          {fechamentos.length > 0 && (
            <Secao titulo="Fechamentos anteriores">
              <LinhaDoTempo movimentos={fechamentos} limite={10} />
            </Secao>
          )}
        </>
      ) : (
        <>
          <Cartao>
            <p className="text-sm text-zinc-400">Dinheiro na gaveta</p>
            <p className="text-4xl font-bold tabular-nums tracking-tight text-zinc-50">{brl(r.dinheiro)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-sm">
              <div>
                <p className="text-xs text-zinc-500">Vendas no turno</p>
                <p className="font-semibold tabular-nums text-emerald-400">{brl(r.vendas - r.estornos)}</p>
                <p className="text-xs text-zinc-500">{r.qtdVendas} venda(s)</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Saídas</p>
                <p className="font-semibold tabular-nums text-rose-400">{brl(r.retiradas + r.despesas)}</p>
                <p className="text-xs text-zinc-500">sangrias + despesas</p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/5 pt-4 text-sm">
              {(Object.keys(FORMAS) as FormaPagamento[])
                .filter((f) => f !== "outro" || r.porForma.outro)
                .map((f) => (
                  <li key={f} className="flex justify-between">
                    <span className="text-zinc-400">{FORMAS[f]}</span>
                    <span className="tabular-nums text-zinc-200">{brl(r.porForma[f])}</span>
                  </li>
                ))}
            </ul>
          </Cartao>

          <Botao className="mt-3 w-full" variante="sucesso" icone="carrinho" onClick={() => setFolha("venda")}>
            Nova venda
          </Botao>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["suprimento", "Suprimento", "mais", "text-emerald-300"],
                ["sangria", "Sangria", "menos", "text-orange-300"],
                ["despesa", "Despesa", "recibo", "text-rose-300"],
              ] as const
            ).map(([t, rot, ic, cor]) => (
              <button
                key={t}
                type="button"
                onClick={() => setLanc(t)}
                className="flex flex-col items-center gap-1 rounded-xl bg-zinc-800 py-3 text-sm text-zinc-100 ring-1 ring-inset ring-white/5 active:bg-zinc-900"
              >
                <Icone nome={ic} className={`size-5 ${cor}`} />
                {rot}
              </button>
            ))}
          </div>
          <Botao className="mt-2 w-full" variante="secundario" icone="cadeado" onClick={() => setFolha("fechar")}>
            Fechar caixa
          </Botao>

          <Secao titulo="Movimentações do turno">
            <LinhaDoTempo movimentos={daSessao} />
          </Secao>
        </>
      )}

      <FormAbrirCaixa aberta={folha === "abrir"} aoFechar={fechar} />
      <FormFecharCaixa aberta={folha === "fechar"} aoFechar={fechar} dados={dados} />
      <FormVenda aberta={folha === "venda"} aoFechar={fechar} dados={dados} />
      <FormLancamento tipo={lanc} aoFechar={() => setLanc(null)} dinheiroDisponivel={r.dinheiro} />
    </div>
  );
}
