"use client";

import { useEffect } from "react";
import { useDados } from "@/lib/store";
import { ir, parseRota, useHash } from "@/lib/router";
import { Confirmacoes, Toasts, cx } from "./ui";
import { Icone } from "./icone";
import { BoasVindas } from "./screens/boas-vindas";
import { Inicio } from "./screens/inicio";
import { Estoque } from "./screens/estoque";
import { DetalheProduto } from "./screens/produto";
import { Caixa } from "./screens/caixa";
import { Historico } from "./screens/historico";
import { DetalheMovimento } from "./screens/movimento";
import { Loja } from "./screens/loja";

const ABAS = [
  { caminho: "/", rotulo: "Início", icone: "inicio", telas: ["inicio"] },
  { caminho: "/estoque", rotulo: "Estoque", icone: "caixaProduto", telas: ["estoque", "produto"] },
  { caminho: "/caixa", rotulo: "Caixa", icone: "dinheiro", telas: ["caixa"] },
  { caminho: "/historico", rotulo: "Histórico", icone: "relogio", telas: ["historico", "movimento"] },
  { caminho: "/loja", rotulo: "Loja", icone: "loja", telas: ["loja"] },
];

export function App() {
  const dados = useDados();
  const hash = useHash();
  const rota = parseRota(hash);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* sem service worker o app continua funcionando, só não abre offline */
    });
  }, []);

  if (dados === undefined)
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
      </div>
    );

  if (dados === null)
    return (
      <>
        <BoasVindas />
        <Toasts />
        <Confirmacoes />
      </>
    );

  let tela: React.ReactNode;
  switch (rota.tela) {
    case "estoque":
      tela = <Estoque dados={dados} />;
      break;
    case "produto":
      tela = <DetalheProduto key={rota.id} dados={dados} id={rota.id} />;
      break;
    case "caixa":
      tela = <Caixa dados={dados} />;
      break;
    case "historico":
      tela = <Historico dados={dados} />;
      break;
    case "movimento":
      tela = <DetalheMovimento key={rota.id} dados={dados} id={rota.id} />;
      break;
    case "loja":
      tela = <Loja key={dados.loja.criadoEm + dados.loja.nome + dados.loja.responsavel} dados={dados} />;
      break;
    default:
      tela = <Inicio dados={dados} />;
  }

  return (
    <>
      <main className="mx-auto w-full max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)]">{tela}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <ul className="mx-auto flex max-w-lg">
          {ABAS.map((a) => {
            const ativa = a.telas.includes(rota.tela);
            return (
              <li key={a.caminho} className="flex-1">
                <button
                  type="button"
                  onClick={() => ir(a.caminho)}
                  aria-current={ativa ? "page" : undefined}
                  className={cx(
                    "flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    ativa ? "text-amber-400" : "text-zinc-500 active:text-zinc-300"
                  )}
                >
                  <span className={cx("rounded-full px-4 py-1 transition-colors", ativa && "bg-amber-400/15")}>
                    <Icone nome={a.icone} className="size-[22px]" />
                  </span>
                  {a.rotulo}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <Toasts />
      <Confirmacoes />
    </>
  );
}
