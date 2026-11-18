"use client";

import { useState } from "react";
import { desbloquear } from "@/lib/senha";
import { Botao, Campo } from "../ui";
import { Icone } from "../icone";

export function Bloqueio({ nomeLoja }: { nomeLoja: string }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [verificando, setVerificando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificando) return;
    setVerificando(true);
    setErro("");
    if (await desbloquear(senha)) return;
    setErro("Senha incorreta. Tente novamente.");
    setSenha("");
    setVerificando(false);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="mb-8">
        <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20">
          <Icone nome="cadeado" className="size-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{nomeLoja}</h1>
        <p className="mt-2 text-zinc-400">Digite a senha para entrar no sistema.</p>
      </div>

      <form onSubmit={enviar} className="space-y-4">
        <Campo
          rotulo="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          readOnly={verificando}
          autoFocus
          required
        />
        {erro && (
          <p role="alert" className="text-sm text-rose-300">
            {erro}
          </p>
        )}
        <Botao type="submit" className="w-full" icone="cadeadoAberto" disabled={verificando}>
          {verificando ? "Verificando…" : "Entrar"}
        </Botao>
      </form>
    </main>
  );
}
