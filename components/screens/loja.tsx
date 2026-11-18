"use client";

import { useState } from "react";
import type { Dados } from "@/lib/types";
import { dataCurta } from "@/lib/format";
import { apagarTudo, atualizarLoja } from "@/lib/store";
import { Botao, Cabecalho, Campo, CampoDescricao, Cartao, Secao, confirmar, tentar } from "../ui";
import { BotaoImportar, baixarBackup } from "../backup";

export function Loja({ dados }: { dados: Dados }) {
  const [nome, setNome] = useState(dados.loja.nome);
  const [resp, setResp] = useState(dados.loja.responsavel);
  const [descricao, setDescricao] = useState("");
  const alterado = nome.trim() !== dados.loja.nome || resp.trim() !== dados.loja.responsavel;

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tentar(() => atualizarLoja(nome, resp, descricao), "Dados da loja salvos")) setDescricao("");
  };

  const tamanho = new Blob([JSON.stringify(dados)]).size;

  const apagar = async () => {
    const ok = await confirmar({
      titulo: "Apagar todos os dados?",
      texto: "Produtos, caixa e todo o histórico deste navegador serão apagados permanentemente. Exporte um backup antes se quiser guardar.",
      confirmar: "Apagar tudo",
      perigo: true,
    });
    if (!ok) return;
    const certeza = await confirmar({
      titulo: "Tem certeza?",
      texto: `Esta ação não pode ser desfeita. A loja "${dados.loja.nome}" será removida deste navegador.`,
      confirmar: "Sim, apagar",
      perigo: true,
    });
    if (certeza) {
      tentar(() => apagarTudo(), "Dados apagados");
      window.location.hash = "";
    }
  };

  return (
    <div>
      <Cabecalho titulo="Loja" subtitulo={`Desde ${dataCurta(dados.loja.criadoEm)}`} />

      <form onSubmit={salvar} className="space-y-4">
        <Campo rotulo="Nome da loja" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Campo rotulo="Responsável" value={resp} onChange={(e) => setResp(e.target.value)} />
        {alterado && <CampoDescricao valor={descricao} onChange={setDescricao} />}
        <Botao type="submit" className="w-full" icone="check" disabled={!alterado}>
          Salvar
        </Botao>
      </form>

      <Secao titulo="Backup">
        <Cartao className="space-y-3">
          <p className="text-sm text-zinc-400">
            Os dados ficam salvos apenas neste navegador ({(tamanho / 1024).toFixed(1).replace(".", ",")} KB). Exporte
            regularmente para não perder nada e para levar a outro aparelho.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Botao icone="exportar" onClick={baixarBackup}>
              Exportar
            </Botao>
            <BotaoImportar substituindo />
          </div>
          <dl className="grid grid-cols-3 gap-2 pt-1 text-center">
            {[
              ["Produtos", dados.produtos.length],
              ["Movimentações", dados.movimentos.length],
              ["Caixa", dados.caixa.sessao ? "Aberto" : "Fechado"],
            ].map(([r, v]) => (
              <div key={r} className="rounded-xl bg-zinc-950/60 py-2">
                <dd className="font-semibold text-zinc-100">{v}</dd>
                <dt className="text-[11px] text-zinc-500">{r}</dt>
              </div>
            ))}
          </dl>
        </Cartao>
      </Secao>

      <Secao titulo="Zona de perigo">
        <Botao variante="perigo" icone="lixo" className="w-full" onClick={apagar}>
          Apagar todos os dados deste navegador
        </Botao>
      </Secao>
      <p className="mt-8 text-center text-xs text-zinc-600">Adm Bar · funciona offline, sem servidor</p>
    </div>
  );
}
