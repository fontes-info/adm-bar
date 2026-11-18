"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Senha de acesso do aparelho. Guarda apenas um hash PBKDF2 com sal, em chave
 * separada dos dados, para que nunca saia no arquivo de backup.
 *
 * É uma trava de uso do dia a dia: como o app não tem servidor, quem tiver
 * acesso às ferramentas do navegador consegue contorná-la.
 */

const CHAVE = "adm-bar:senha";
const ITERACOES = 600_000;
const BYTES_SAL = 16;
const BITS_HASH = 256;
/** Celulares mantêm a página viva em segundo plano: voltar depois disso conta como reabrir. */
const AUSENCIA_MAXIMA_MS = 5 * 60 * 1000;

export const SENHA_MINIMA = 4;

export interface RegistroSenha {
  algoritmo: "PBKDF2-SHA-256";
  iteracoes: number;
  sal: string;
  hash: string;
}

const paraBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const deBase64 = (texto: string) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));

/** `crypto.subtle` só existe em conexão segura (HTTPS ou localhost). */
export function senhaDisponivel() {
  return typeof crypto !== "undefined" && !!crypto.subtle;
}

async function derivar(senha: string, sal: Uint8Array<ArrayBuffer>, iteracoes: number) {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(senha.normalize("NFC")),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteracoes },
    chave,
    BITS_HASH
  );
  return paraBase64(new Uint8Array(bits));
}

/* ---------------------------------------------------- leitura / estado */

let cache: RegistroSenha | null | undefined;
let desbloqueado = false;
const ouvintes = new Set<() => void>();

function ler(): RegistroSenha | null {
  if (cache === undefined) {
    try {
      const r = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as RegistroSenha | null;
      const valido =
        !!r && typeof r.sal === "string" && typeof r.hash === "string" && Number.isInteger(r.iteracoes) && r.iteracoes > 0;
      cache = valido ? r : null;
    } catch {
      cache = null;
    }
  }
  return cache;
}

function notificar() {
  ouvintes.forEach((o) => o());
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  const aoMudarStorage = (e: StorageEvent) => {
    if (e.key === CHAVE || e.key === null) {
      cache = undefined;
      ouvinte();
    }
  };
  window.addEventListener("storage", aoMudarStorage);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", aoMudarStorage);
  };
}

const temSenha = () => ler() !== null;
const estaBloqueado = () => temSenha() && !desbloqueado;

export const useTemSenha = () => useSyncExternalStore(inscrever, temSenha, () => false);
export const useBloqueado = () => useSyncExternalStore(inscrever, estaBloqueado, () => false);

function bloquear() {
  desbloqueado = false;
  notificar();
}

/** Volta a pedir a senha quando a página é restaurada sem recarregar. */
export function useBloqueioAoReabrir() {
  useEffect(() => {
    let ocultoEm: number | null = null;
    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        ocultoEm = Date.now();
        return;
      }
      if (ocultoEm !== null && Date.now() - ocultoEm >= AUSENCIA_MAXIMA_MS) bloquear();
      ocultoEm = null;
    };
    const aoMostrarPagina = (e: PageTransitionEvent) => {
      if (e.persisted) bloquear();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("pageshow", aoMostrarPagina);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pageshow", aoMostrarPagina);
    };
  }, []);
}

/* ------------------------------------------------------------- ações */

function validarNovaSenha(senha: string, confirmacao: string) {
  if (!senhaDisponivel()) throw new Error("A senha só pode ser usada em conexão segura (HTTPS).");
  if (senha.length < SENHA_MINIMA) throw new Error(`A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`);
  if (senha !== confirmacao) throw new Error("As senhas digitadas não são iguais.");
}

export async function prepararSenha(senha: string, confirmacao: string): Promise<RegistroSenha> {
  validarNovaSenha(senha, confirmacao);
  const sal = crypto.getRandomValues(new Uint8Array(BYTES_SAL));
  return {
    algoritmo: "PBKDF2-SHA-256",
    iteracoes: ITERACOES,
    sal: paraBase64(sal),
    hash: await derivar(senha, sal, ITERACOES),
  };
}

export function salvarRegistroSenha(registro: RegistroSenha) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(registro));
  } catch {
    throw new Error("Não foi possível salvar a senha neste navegador.");
  }
  cache = registro;
  desbloqueado = true;
  notificar();
}

export function limparSenha() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* armazenamento bloqueado: não há senha gravada para remover */
  }
  cache = null;
  desbloqueado = false;
  notificar();
}

async function confere(senha: string, registro: RegistroSenha) {
  try {
    return (await derivar(senha, deBase64(registro.sal), registro.iteracoes)) === registro.hash;
  } catch {
    return false;
  }
}

export async function desbloquear(senha: string) {
  const registro = ler();
  if (!registro) return true;
  const ok = await confere(senha, registro);
  if (ok) {
    desbloqueado = true;
    notificar();
  }
  return ok;
}

/** Adiciona uma senha ou troca a atual, que precisa ser confirmada. */
export async function trocarSenha(atual: string, nova: string, confirmacao: string) {
  validarNovaSenha(nova, confirmacao);
  const registro = ler();
  if (registro && !(await confere(atual, registro))) throw new Error("A senha atual está incorreta.");
  salvarRegistroSenha(await prepararSenha(nova, confirmacao));
}

/** Remove a proteção; exige a senha atual para um funcionário não desativá-la. */
export async function removerSenha(atual: string) {
  const registro = ler();
  if (registro && !(await confere(atual, registro))) throw new Error("A senha atual está incorreta.");
  limparSenha();
}
