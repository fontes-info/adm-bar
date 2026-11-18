"use client";

import { useMemo, useState } from "react";
import type { Dados } from "@/lib/types";
import { TIPOS, type Grupo } from "@/lib/movimentos";
import { Cabecalho, Chips, Vazio } from "../ui";
import { Icone } from "../icone";
import { LinhaDoTempo } from "../linha-do-tempo";

type Filtro = "todos" | Grupo | "venda" | "descricao";

export function Historico({ dados }: { dados: Dados }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [limite, setLimite] = useState(80);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return dados.movimentos.filter((m) => {
      const meta = TIPOS[m.tipo];
      if (filtro === "venda" && m.tipo !== "venda" && m.tipo !== "estorno") return false;
      if (filtro === "descricao" && !m.descricao) return false;
      if ((filtro === "estoque" || filtro === "caixa" || filtro === "sistema") && meta?.grupo !== filtro) return false;
      if (periodo) {
        const d = new Date(m.criadoEm);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (local !== periodo) return false;
      }
      if (!t) return true;
      const texto = [
        meta?.rotulo,
        m.descricao,
        m.produtoNome,
        ...(m.itens?.map((i) => i.nome) ?? []),
        ...(m.alteracoes ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(t);
    });
  }, [dados.movimentos, filtro, busca, periodo]);

  return (
    <div>
      <Cabecalho titulo="Histórico" subtitulo={`${lista.length} movimentação(ões)`} />
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Icone nome="busca" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto, descrição…"
            className="w-full rounded-xl bg-zinc-900 py-3 pl-11 pr-3 text-base text-zinc-100 outline-none ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-400/70"
          />
        </div>
        <input
          type="date"
          aria-label="Filtrar por dia"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-[8.5rem] rounded-xl bg-zinc-900 px-3 text-sm text-zinc-200 outline-none ring-1 ring-inset ring-white/10 [color-scheme:dark]"
        />
      </div>
      <Chips
        className="mb-4"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { valor: "todos", rotulo: "Todos" },
          { valor: "venda", rotulo: "Vendas" },
          { valor: "estoque", rotulo: "Estoque" },
          { valor: "caixa", rotulo: "Caixa" },
          { valor: "descricao", rotulo: "Com descrição" },
          { valor: "sistema", rotulo: "Sistema" },
        ]}
      />
      {lista.length ? (
        <>
          <LinhaDoTempo movimentos={lista} limite={limite} />
          {lista.length > limite && (
            <button
              type="button"
              onClick={() => setLimite(limite + 100)}
              className="mt-4 w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-amber-400 ring-1 ring-white/5"
            >
              Carregar mais ({lista.length - limite})
            </button>
          )}
        </>
      ) : (
        <Vazio icone="relogio" titulo="Nada por aqui" texto="Nenhuma movimentação corresponde aos filtros." />
      )}
    </div>
  );
}
