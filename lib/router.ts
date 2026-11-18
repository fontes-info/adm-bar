"use client";

import { useSyncExternalStore } from "react";

export type Rota =
  | { tela: "inicio" }
  | { tela: "estoque" }
  | { tela: "produto"; id: string }
  | { tela: "caixa" }
  | { tela: "historico" }
  | { tela: "movimento"; id: string }
  | { tela: "loja" };

function inscrever(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function parseRota(hash: string): Rota {
  const [, a, b] = hash.replace(/^#/, "").split("/");
  switch (a) {
    case "estoque":
      return { tela: "estoque" };
    case "produto":
      return b ? { tela: "produto", id: decodeURIComponent(b) } : { tela: "estoque" };
    case "caixa":
      return { tela: "caixa" };
    case "historico":
      return { tela: "historico" };
    case "movimento":
      return b ? { tela: "movimento", id: decodeURIComponent(b) } : { tela: "historico" };
    case "loja":
      return { tela: "loja" };
    default:
      return { tela: "inicio" };
  }
}

export function useHash() {
  return useSyncExternalStore(inscrever, () => window.location.hash, () => "");
}

let navegouNoApp = false;

export function ir(caminho: string) {
  navegouNoApp = true;
  window.location.hash = caminho;
}

export function voltar(alternativa = "/") {
  if (navegouNoApp && window.history.length > 1) window.history.back();
  else window.location.replace(`#${alternativa}`);
}
