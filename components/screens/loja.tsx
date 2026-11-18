"use client";

import { useState } from "react";
import type { Dados, Produto } from "@/lib/types";
import { dataCurta } from "@/lib/format";
import { adicionarCategoria, apagarTudo, atualizarLoja, registrarAlteracaoSenha, removerCategoria } from "@/lib/store";
import { SENHA_MINIMA, removerSenha, senhaDisponivel, trocarSenha, useTemSenha } from "@/lib/senha";
import { Botao, Cabecalho, Campo, CampoDescricao, Cartao, Folha, Secao, avisar, confirmar, tentar } from "../ui";
import { Icone } from "../icone";
import { BotaoImportar, baixarBackup } from "../backup";

function SecaoCategorias({ categorias, produtos }: { categorias: string[]; produtos: Produto[] }) {
  const [nova, setNova] = useState("");
  const emUso = new Set(produtos.map((p) => p.categoria));

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tentar(() => adicionarCategoria(nova), "Categoria adicionada")) setNova("");
  };

  const excluir = async (nome: string) => {
    const ok = await confirmar({
      titulo: "Excluir categoria?",
      texto: `A categoria "${nome}" não tem produtos e sairá da lista.`,
      confirmar: "Excluir",
      perigo: true,
    });
    if (ok) tentar(() => removerCategoria(nome), "Categoria excluída");
  };

  return (
    <Secao titulo="Categorias">
      <Cartao className="space-y-4">
        {categorias.length > 0 && (
          <div className="space-y-2">
            <ul className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <li
                  key={c}
                  className="flex min-h-9 items-center rounded-full bg-zinc-950/60 pl-3 pr-3 text-sm text-zinc-200 ring-1 ring-inset ring-white/10 has-[button]:pr-1"
                >
                  {c}
                  {!emUso.has(c) && (
                    <button
                      type="button"
                      aria-label={`Excluir categoria ${c}`}
                      title={`Excluir categoria ${c}`}
                      onClick={() => excluir(c)}
                      className="ml-1 inline-flex size-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300 active:bg-rose-500/25"
                    >
                      <Icone nome="fechar" className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500">Só categorias sem produtos podem ser excluídas.</p>
          </div>
        )}
        <form onSubmit={adicionar} className="flex items-end gap-2">
          <Campo
            rotulo="Nova categoria"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            placeholder="Ex.: Petiscos"
            maxLength={40}
            className="min-w-0 flex-1"
          />
          <Botao type="submit" variante="secundario" icone="mais" disabled={!nova.trim()}>
            Adicionar
          </Botao>
        </form>
      </Cartao>
    </Secao>
  );
}

function CorpoSenha({ temSenha, aoFechar }: { temSenha: boolean; aoFechar: () => void }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    try {
      await trocarSenha(atual, nova, confirmacao);
      registrarAlteracaoSenha(temSenha ? "alterada" : "adicionada");
      avisar(temSenha ? "Senha alterada" : "Senha adicionada");
      aoFechar();
    } catch (err) {
      avisar(err instanceof Error ? err.message : "Não foi possível salvar a senha.", "erro");
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={salvar} className="space-y-4 pt-2">
      {temSenha && (
        <Campo
          rotulo="Senha atual"
          type="password"
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
      )}
      <Campo
        rotulo="Nova senha"
        type="password"
        value={nova}
        onChange={(e) => setNova(e.target.value)}
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        dica={`Mínimo de ${SENHA_MINIMA} caracteres. Anote-a: não é possível recuperar uma senha esquecida.`}
        autoFocus={!temSenha}
        required
      />
      <Campo
        rotulo="Confirmar nova senha"
        type="password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        autoComplete="new-password"
        required
      />
      <Botao type="submit" className="w-full" icone="check" disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar senha"}
      </Botao>
    </form>
  );
}

function CorpoRemoverSenha({ aoFechar }: { aoFechar: () => void }) {
  const [atual, setAtual] = useState("");
  const [removendo, setRemovendo] = useState(false);

  const remover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (removendo) return;
    setRemovendo(true);
    try {
      await removerSenha(atual);
      registrarAlteracaoSenha("removida");
      avisar("Senha removida");
      aoFechar();
    } catch (err) {
      avisar(err instanceof Error ? err.message : "Não foi possível remover a senha.", "erro");
      setRemovendo(false);
    }
  };

  return (
    <form onSubmit={remover} className="space-y-4 pt-2">
      <p className="text-[15px] leading-relaxed text-zinc-300">
        Sem senha, qualquer pessoa com este aparelho poderá entrar no sistema e fazer alterações.
      </p>
      <Campo
        rotulo="Senha atual"
        type="password"
        value={atual}
        onChange={(e) => setAtual(e.target.value)}
        autoComplete="current-password"
        autoFocus
        required
      />
      <Botao type="submit" variante="perigo" className="w-full" icone="cadeadoAberto" disabled={removendo}>
        {removendo ? "Removendo…" : "Remover senha"}
      </Botao>
    </form>
  );
}

function SecaoSenha() {
  const temSenha = useTemSenha();
  const [modo, setModo] = useState<"salvar" | "remover" | null>(null);
  const disponivel = senhaDisponivel();
  const titulo = temSenha ? "Alterar senha" : "Adicionar senha";
  const fechar = () => setModo(null);

  return (
    <Secao titulo="Senha de acesso">
      <Cartao className="space-y-3">
        <p className="text-sm text-zinc-400">
          {!disponivel
            ? "A senha só pode ser usada quando o sistema é aberto em conexão segura (HTTPS)."
            : temSenha
              ? "A senha é pedida sempre que o sistema é aberto neste aparelho."
              : "Nenhuma senha cadastrada: qualquer pessoa com este aparelho entra no sistema."}
        </p>
        <Botao variante="secundario" icone="cadeado" className="w-full" disabled={!disponivel} onClick={() => setModo("salvar")}>
          {titulo}
        </Botao>
        {temSenha && (
          <Botao variante="perigo" icone="cadeadoAberto" className="w-full" disabled={!disponivel} onClick={() => setModo("remover")}>
            Remover senha
          </Botao>
        )}
      </Cartao>
      <Folha aberta={modo !== null} aoFechar={fechar} titulo={modo === "remover" ? "Remover senha" : titulo}>
        {modo === "salvar" && <CorpoSenha temSenha={temSenha} aoFechar={fechar} />}
        {modo === "remover" && <CorpoRemoverSenha aoFechar={fechar} />}
      </Folha>
    </Secao>
  );
}

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

      <SecaoCategorias categorias={dados.categorias} produtos={dados.produtos} />
      <SecaoSenha />

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
