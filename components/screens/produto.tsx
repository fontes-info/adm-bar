"use client";

import { useState } from "react";
import type { Dados } from "@/lib/types";
import { brl, dataCurta, qtd } from "@/lib/format";
import { excluirProduto, movimentosDoProduto } from "@/lib/store";
import { voltar } from "@/lib/router";
import { BotaoIcone, Botao, Cabecalho, CampoDescricao, Cartao, Folha, Secao, Vazio, cx, tentar } from "../ui";
import { Icone } from "../icone";
import { LinhaDoTempo } from "../linha-do-tempo";
import { FormEstoque, FormProduto, type TipoEstoque } from "../formularios";

export function DetalheProduto({ dados, id }: { dados: Dados; id: string }) {
  const [editar, setEditar] = useState(false);
  const [tipo, setTipo] = useState<TipoEstoque | null>(null);
  const [excluir, setExcluir] = useState(false);
  const [motivo, setMotivo] = useState("");
  const p = dados.produtos.find((x) => x.id === id);
  const historico = movimentosDoProduto(dados, id);

  if (!p)
    return (
      <div>
        <Cabecalho titulo="Produto" voltarPara="/estoque" />
        <Vazio icone="caixaProduto" titulo="Produto não encontrado" texto="Ele pode ter sido excluído.">
          {historico.length > 0 && <p className="text-sm text-zinc-400">Histórico preservado abaixo.</p>}
        </Vazio>
        {historico.length > 0 && <LinhaDoTempo movimentos={historico} produtoId={id} />}
      </div>
    );

  const baixo = p.quantidade <= p.estoqueMinimo;
  const margem = p.precoVenda > 0 ? ((p.precoVenda - p.custo) / p.precoVenda) * 100 : 0;
  const vendido = historico
    .filter((m) => m.tipo === "venda" && !m.refId)
    .reduce((s, m) => s + (m.itens?.find((i) => i.produtoId === id)?.quantidade ?? 0), 0);
  const categorias = [...new Set(dados.produtos.map((x) => x.categoria).filter(Boolean))];

  const confirmarExclusao = () => {
    if (tentar(() => excluirProduto(p.id, motivo), "Produto excluído")) {
      setExcluir(false);
      voltar("/estoque");
    }
  };

  return (
    <div>
      <Cabecalho
        titulo={p.nome}
        subtitulo={p.categoria || "Sem categoria"}
        voltarPara="/estoque"
        acoes={
          <>
            <BotaoIcone icone="lapis" rotulo="Editar" onClick={() => setEditar(true)} />
            <BotaoIcone icone="lixo" rotulo="Excluir" onClick={() => setExcluir(true)} className="text-rose-400" />
          </>
        }
      />

      <Cartao>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Em estoque</p>
            <p className={cx("text-4xl font-bold tabular-nums tracking-tight", baixo ? "text-rose-300" : "text-zinc-50")}>
              {qtd(p.quantidade)} <span className="text-lg font-medium text-zinc-500">{p.unidade}</span>
            </p>
          </div>
          {baixo && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300">
              <Icone nome="alerta" className="size-3.5" /> Estoque baixo
            </span>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Venda</dt>
            <dd className="font-semibold tabular-nums text-zinc-100">{brl(p.precoVenda)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Custo</dt>
            <dd className="font-semibold tabular-nums text-zinc-100">{brl(p.custo)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Margem</dt>
            <dd className={cx("font-semibold tabular-nums", margem >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {p.custo ? `${margem.toFixed(0)}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Mínimo</dt>
            <dd className="tabular-nums text-zinc-200">{qtd(p.estoqueMinimo)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Vendido</dt>
            <dd className="tabular-nums text-zinc-200">{qtd(vendido)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Valor total</dt>
            <dd className="tabular-nums text-zinc-200">{brl(Math.round(p.custo * p.quantidade))}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-zinc-500">
          {p.codigo && <>Código {p.codigo} · </>}Cadastrado {dataCurta(p.criadoEm)} · Atualizado {dataCurta(p.atualizadoEm)}
        </p>
      </Cartao>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Botao variante="secundario" icone="setaBaixo" className="flex-col gap-1 py-3 text-sm text-emerald-300" onClick={() => setTipo("entrada")}>
          Entrada
        </Botao>
        <Botao variante="secundario" icone="setaCima" className="flex-col gap-1 py-3 text-sm text-orange-300" onClick={() => setTipo("saida")}>
          Saída
        </Botao>
        <Botao variante="secundario" icone="ajuste" className="flex-col gap-1 py-3 text-sm text-amber-300" onClick={() => setTipo("ajuste")}>
          Ajuste
        </Botao>
      </div>

      <Secao titulo={`Linha do tempo (${historico.length})`}>
        {historico.length ? (
          <LinhaDoTempo movimentos={historico} produtoId={p.id} />
        ) : (
          <p className="py-6 text-center text-sm text-zinc-500">Sem movimentações.</p>
        )}
      </Secao>

      <FormProduto aberta={editar} aoFechar={() => setEditar(false)} produto={p} categorias={categorias} />
      <FormEstoque tipo={tipo} produto={p} aoFechar={() => setTipo(null)} />
      <Folha aberta={excluir} aoFechar={() => setExcluir(false)} titulo="Excluir produto">
        <div className="space-y-4 pt-2">
          <p className="text-[15px] text-zinc-300">
            Excluir <b className="text-zinc-50">{p.nome}</b>? O produto sai do estoque, mas o histórico de movimentações é mantido.
          </p>
          <CampoDescricao valor={motivo} onChange={setMotivo} rotulo="Motivo" placeholder="Ex.: produto descontinuado" />
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="secundario" onClick={() => setExcluir(false)}>
              Cancelar
            </Botao>
            <Botao variante="perigo" icone="lixo" onClick={confirmarExclusao}>
              Excluir
            </Botao>
          </div>
        </div>
      </Folha>
    </div>
  );
}
