"use client";

import { useState } from "react";
import type { Dados } from "@/lib/types";
import { brl, dataCurta, dataHoraCompleta, qtd } from "@/lib/format";
import { CORES, FORMAS, TIPOS, sinalCaixa } from "@/lib/movimentos";
import { editarDescricao, estornarVenda } from "@/lib/store";
import { ir } from "@/lib/router";
import { Botao, Cabecalho, CampoDescricao, Cartao, Folha, Secao, Vazio, cx, tentar } from "../ui";
import { Icone } from "../icone";

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-zinc-400">{rotulo}</dt>
      <dd className="text-right text-sm text-zinc-100">{children}</dd>
    </div>
  );
}

export function DetalheMovimento({ dados, id }: { dados: Dados; id: string }) {
  const m = dados.movimentos.find((x) => x.id === id);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(m?.descricao ?? "");
  const [estornar, setEstornar] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!m)
    return (
      <div>
        <Cabecalho titulo="Movimentação" voltarPara="/historico" />
        <Vazio icone="relogio" titulo="Movimentação não encontrada" />
      </div>
    );

  const meta = TIPOS[m.tipo] ?? TIPOS.cadastro;
  const cor = CORES[meta.cor];
  const sinal = sinalCaixa(m.tipo);
  const ref = m.refId ? dados.movimentos.find((x) => x.id === m.refId) : undefined;
  const produtoExiste = m.produtoId && dados.produtos.some((p) => p.id === m.produtoId);

  const salvarDescricao = () => {
    if (tentar(() => editarDescricao(m.id, texto), "Descrição salva")) setEditando(false);
  };

  return (
    <div>
      <Cabecalho titulo={meta.rotulo} subtitulo={dataCurta(m.criadoEm)} voltarPara="/historico" />

      <div className="flex flex-col items-center pb-2 pt-2 text-center">
        <span className={cx("flex size-16 items-center justify-center rounded-full ring-1", cor.bolha)}>
          <Icone nome={meta.icone} className="size-7" />
        </span>
        {m.valor !== undefined && m.tipo !== "produto_criado" && (
          <p
            className={cx(
              "mt-3 text-3xl font-bold tabular-nums tracking-tight",
              sinal > 0 ? "text-emerald-400" : sinal < 0 ? "text-rose-400" : "text-zinc-50",
              m.tipo === "venda" && m.refId && "line-through decoration-2"
            )}
          >
            {sinal > 0 ? "+ " : sinal < 0 ? "− " : ""}
            {brl(m.valor)}
          </p>
        )}
        <p className="mt-1 text-sm capitalize text-zinc-400">{dataHoraCompleta(m.criadoEm)}</p>
      </div>

      <Secao
        titulo="Descrição"
        acao={
          !editando && (
            <button type="button" className="text-sm font-medium text-amber-400" onClick={() => { setTexto(m.descricao ?? ""); setEditando(true); }}>
              {m.descricao ? "Editar" : "Adicionar"}
            </button>
          )
        }
      >
        {editando ? (
          <div className="space-y-2">
            <CampoDescricao valor={texto} onChange={setTexto} rotulo="Explique esta movimentação" />
            <div className="grid grid-cols-2 gap-2">
              <Botao variante="secundario" onClick={() => setEditando(false)}>
                Cancelar
              </Botao>
              <Botao onClick={salvarDescricao} icone="check">
                Salvar
              </Botao>
            </div>
          </div>
        ) : m.descricao ? (
          <Cartao className="border-l-2 border-amber-400/60">
            <p className="whitespace-pre-wrap text-[15px] italic text-zinc-200">{m.descricao}</p>
            {m.descricaoEditadaEm && <p className="mt-2 text-xs text-zinc-500">Editada em {dataCurta(m.descricaoEditadaEm)}</p>}
          </Cartao>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-500">
            Sem descrição. Toque em “Adicionar” para explicar esta ação.
          </p>
        )}
      </Secao>

      <Secao titulo="Detalhes">
        <Cartao className="py-1">
          <dl className="divide-y divide-white/5">
            <Linha rotulo="Tipo">{meta.rotulo}</Linha>
            <Linha rotulo="Dia">{new Date(m.criadoEm).toLocaleDateString("pt-BR")}</Linha>
            <Linha rotulo="Horário">{new Date(m.criadoEm).toLocaleTimeString("pt-BR")}</Linha>
            {m.produtoNome && (
              <Linha rotulo="Produto">
                {produtoExiste ? (
                  <button type="button" className="font-medium text-amber-400" onClick={() => ir(`/produto/${encodeURIComponent(m.produtoId!)}`)}>
                    {m.produtoNome}
                  </button>
                ) : (
                  <span>{m.produtoNome} <span className="text-zinc-500">(excluído)</span></span>
                )}
              </Linha>
            )}
            {m.quantidade !== undefined && m.tipo !== "produto_criado" && <Linha rotulo="Quantidade">{qtd(m.quantidade)}</Linha>}
            {m.estoqueAntes !== undefined && (
              <Linha rotulo="Estoque">
                {qtd(m.estoqueAntes)} → <b>{qtd(m.estoqueDepois ?? 0)}</b>
              </Linha>
            )}
            {m.formaPagamento && <Linha rotulo="Pagamento">{FORMAS[m.formaPagamento]}</Linha>}
            {m.tipo === "fechamento" && (
              <>
                <Linha rotulo="Esperado em dinheiro">{brl(m.esperado ?? 0)}</Linha>
                <Linha rotulo="Contado">{brl(m.contado ?? 0)}</Linha>
                <Linha rotulo="Diferença">
                  {(() => {
                    const d = (m.contado ?? 0) - (m.esperado ?? 0);
                    return <span className={d === 0 ? "text-emerald-400" : d > 0 ? "text-sky-400" : "text-rose-400"}>{d > 0 ? "+" : ""}{brl(d)}</span>;
                  })()}
                </Linha>
              </>
            )}
            {ref && (
              <Linha rotulo={m.tipo === "venda" ? "Estornada em" : "Venda original"}>
                <button type="button" className="font-medium text-amber-400" onClick={() => ir(`/movimento/${encodeURIComponent(ref.id)}`)}>
                  {dataCurta(ref.criadoEm)}
                </button>
              </Linha>
            )}
          </dl>
        </Cartao>
      </Secao>

      {m.itens && m.itens.length > 0 && (
        <Secao titulo="Itens">
          <Cartao className="py-1">
            <ul className="divide-y divide-white/5">
              {m.itens.map((i) => (
                <li key={i.produtoId} className="py-2.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-zinc-100">
                      {qtd(i.quantidade)}× {i.nome}
                    </span>
                    <span className="tabular-nums text-zinc-100">{brl(Math.round(i.precoUnit * i.quantidade))}</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {brl(i.precoUnit)} cada · estoque {qtd(i.estoqueAntes)} → {qtd(i.estoqueDepois)}
                  </p>
                </li>
              ))}
            </ul>
          </Cartao>
        </Secao>
      )}

      {m.alteracoes && m.alteracoes.length > 0 && (
        <Secao titulo={m.tipo === "fechamento" ? "Resumo do turno" : "Alterações"}>
          <Cartao className="py-1">
            <ul className="divide-y divide-white/5">
              {m.alteracoes.map((a, i) => (
                <li key={i} className="py-2.5 text-sm text-zinc-200">
                  {a}
                </li>
              ))}
            </ul>
          </Cartao>
        </Secao>
      )}

      {m.tipo === "venda" && !m.refId && (
        <div className="mt-6">
          <Botao
            variante="perigo"
            icone="desfazer"
            className="w-full"
            disabled={!dados.caixa.sessao}
            onClick={() => setEstornar(true)}
          >
            Estornar venda
          </Botao>
          {!dados.caixa.sessao && <p className="mt-2 text-center text-xs text-zinc-500">Abra o caixa para estornar.</p>}
        </div>
      )}

      <Folha aberta={estornar} aoFechar={() => setEstornar(false)} titulo="Estornar venda">
        <div className="space-y-4 pt-2">
          <p className="text-[15px] text-zinc-300">
            Os produtos voltam ao estoque e <b className="text-zinc-50">{brl(m.valor ?? 0)}</b> sai do caixa atual.
          </p>
          <CampoDescricao valor={motivo} onChange={setMotivo} rotulo="Motivo" placeholder="Ex.: cliente desistiu, lançado errado" />
          <Botao
            variante="perigo"
            icone="desfazer"
            className="w-full"
            onClick={() => {
              if (tentar(() => estornarVenda(m.id, motivo), "Venda estornada")) setEstornar(false);
            }}
          >
            Confirmar estorno
          </Botao>
        </div>
      </Folha>
    </div>
  );
}
