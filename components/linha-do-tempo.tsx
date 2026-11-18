"use client";

import type { Movimento } from "@/lib/types";
import { brl, chaveDia, hora, rotuloDia } from "@/lib/format";
import { CORES, TIPOS, resumoMovimento, sinalCaixa } from "@/lib/movimentos";
import { ir } from "@/lib/router";
import { Icone } from "./icone";
import { cx } from "./ui";

export function LinhaDoTempo({
  movimentos,
  produtoId,
  limite,
}: {
  movimentos: Movimento[];
  /** quando informado, resume vendas pela linha deste produto */
  produtoId?: string;
  limite?: number;
}) {
  const ordenados = [...movimentos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, limite);

  const grupos: { dia: string; rotulo: string; itens: Movimento[] }[] = [];
  for (const m of ordenados) {
    const dia = chaveDia(m.criadoEm);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.dia === dia) ultimo.itens.push(m);
    else grupos.push({ dia, rotulo: rotuloDia(m.criadoEm), itens: [m] });
  }

  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <div key={g.dia}>
          <p className="sticky top-14 z-10 -mx-4 mb-1 bg-zinc-950/90 px-4 py-1.5 text-xs font-semibold capitalize text-zinc-400 backdrop-blur">
            {g.rotulo}
          </p>
          <ol className="relative">
            {g.itens.map((m, i) => (
              <ItemLinha key={m.id} m={m} produtoId={produtoId} ultimo={i === g.itens.length - 1} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function ItemLinha({ m, produtoId, ultimo }: { m: Movimento; produtoId?: string; ultimo: boolean }) {
  const meta = TIPOS[m.tipo] ?? TIPOS.cadastro;
  const cor = CORES[meta.cor];
  const sinal = sinalCaixa(m.tipo);
  const estornada = m.tipo === "venda" && !!m.refId;
  const resumo = resumoMovimento(m, produtoId);

  return (
    <li className="relative flex gap-3">
      {!ultimo && <span className="absolute bottom-0 left-[19px] top-11 w-px bg-zinc-800" aria-hidden />}
      <button
        type="button"
        onClick={() => ir(`/movimento/${encodeURIComponent(m.id)}`)}
        className="group flex w-full gap-3 rounded-xl py-2 text-left transition-colors active:bg-white/5"
      >
        <span className={cx("relative z-[1] mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ring-1", cor.bolha)}>
          <Icone nome={meta.icone} className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1 pr-1">
          <span className="flex items-start justify-between gap-2">
            <span className={cx("font-medium text-zinc-100", estornada && "line-through decoration-zinc-500")}>
              {meta.rotulo}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-zinc-500">{hora(m.criadoEm)}</span>
          </span>
          {resumo && <span className="mt-0.5 block text-sm text-zinc-400">{resumo}</span>}
          {m.valor !== undefined && m.tipo !== "produto_criado" && (sinal !== 0 || m.tipo === "abertura" || m.tipo === "entrada") && (
            <span
              className={cx(
                "mt-0.5 block text-sm font-semibold tabular-nums",
                sinal > 0 ? "text-emerald-400" : sinal < 0 ? "text-rose-400" : "text-zinc-300"
              )}
            >
              {sinal > 0 ? "+ " : sinal < 0 ? "− " : ""}
              {brl(m.valor)}
              {estornada && <span className="ml-2 text-xs font-normal text-rose-400">estornada</span>}
            </span>
          )}
          {m.descricao && (
            <span className="mt-1.5 block rounded-lg border-l-2 border-amber-400/60 bg-zinc-900 px-2.5 py-1.5 text-sm italic text-zinc-300">
              {m.descricao}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
