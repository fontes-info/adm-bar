"use client";

import { useState } from "react";
import { cadastrar } from "@/lib/store";
import { Botao, Campo, tentar } from "../ui";
import { Icone } from "../icone";
import { BotaoImportar } from "../backup";

export function BoasVindas() {
  const [nome, setNome] = useState("");
  const [loja, setLoja] = useState("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    tentar(() => cadastrar(nome, loja), `Bem-vindo(a), ${nome.trim()}!`);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+3rem)]">
      <div className="mb-8">
        <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20">
          <Icone nome="copo" className="size-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Adm Bar</h1>
        <p className="mt-2 text-zinc-400">
          Controle de estoque e caixa direto no navegador. Seus dados ficam salvos só neste aparelho — use{" "}
          <b className="text-zinc-200">Exportar</b> para fazer backup.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Primeiro acesso · cadastro</h2>
        <Campo rotulo="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Souza" autoComplete="name" required />
        <Campo rotulo="Nome da loja" value={loja} onChange={(e) => setLoja(e.target.value)} placeholder="Ex.: Bar do Zé" autoComplete="organization" required />
        <Botao type="submit" className="w-full" icone="check">
          Criar minha loja
        </Botao>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-600">
        <span className="h-px flex-1 bg-zinc-800" />
        ou
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="rounded-2xl bg-zinc-900/70 p-4 ring-1 ring-white/5">
        <p className="font-medium text-zinc-100">Já usa em outro aparelho?</p>
        <p className="mb-3 mt-1 text-sm text-zinc-400">Importe o arquivo de backup (.json) exportado anteriormente.</p>
        <BotaoImportar className="w-full" variante="secundario" />
      </div>
    </main>
  );
}
