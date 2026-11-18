"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { Icone } from "./icone";
import { voltar } from "@/lib/router";

/* ------------------------------------------------------------ helpers */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------- botões */

type Variante = "primario" | "secundario" | "fantasma" | "perigo" | "sucesso";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-amber-400 text-zinc-950 hover:bg-amber-300 active:bg-amber-500 font-semibold",
  secundario: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 ring-1 ring-inset ring-white/5",
  fantasma: "text-zinc-300 hover:bg-white/5 active:bg-white/10",
  perigo: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 ring-1 ring-inset ring-rose-500/30",
  sucesso: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold",
};

export function Botao({
  variante = "primario",
  icone,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; icone?: string }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] transition-colors disabled:pointer-events-none disabled:opacity-40",
        VARIANTES[variante],
        className
      )}
    >
      {icone && <Icone nome={icone} className="size-5 shrink-0" />}
      {children}
    </button>
  );
}

export function BotaoIcone({
  icone,
  rotulo,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icone: string; rotulo: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      {...props}
      className={cx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/5 active:bg-white/10",
        className
      )}
    >
      <Icone nome={icone} />
    </button>
  );
}

/* ------------------------------------------------------------- campos */

const estiloCampo =
  "w-full rounded-xl bg-zinc-900 px-4 py-3 text-base text-zinc-100 ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-amber-400/70";

export function Campo({
  rotulo,
  dica,
  opcional,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { rotulo: string; dica?: string; opcional?: boolean }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-zinc-300">
        {rotulo}
        {opcional && <span className="text-xs font-normal text-zinc-500">opcional</span>}
      </label>
      <input id={id} className={estiloCampo} {...props} />
      {dica && <p className="mt-1 text-xs text-zinc-500">{dica}</p>}
    </div>
  );
}

export function CampoDescricao({
  valor,
  onChange,
  rotulo = "Descrição",
  placeholder = "Explique o motivo desta ação, se quiser…",
}: {
  valor: string;
  onChange: (v: string) => void;
  rotulo?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-zinc-300">
        {rotulo}
        <span className="text-xs font-normal text-zinc-500">opcional</span>
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={500}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(estiloCampo, "resize-none")}
      />
    </div>
  );
}

export function Chips<T extends string>({
  opcoes,
  valor,
  onChange,
  className,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]", className)}>
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={cx(
            "shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors",
            o.valor === valor
              ? "bg-amber-400 font-semibold text-zinc-950"
              : "bg-zinc-900 text-zinc-300 ring-1 ring-inset ring-white/10"
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ layout */

export function Cartao({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...p} className={cx("rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-inset ring-white/[0.06]", className)}>
      {children}
    </div>
  );
}

export function Cabecalho({
  titulo,
  subtitulo,
  voltarPara,
  acoes,
}: {
  titulo: string;
  subtitulo?: string;
  voltarPara?: string;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-1 border-b border-white/5 bg-zinc-950/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex min-h-14 flex-1 items-center gap-1">
        {voltarPara ? (
          <BotaoIcone icone="voltar" rotulo="Voltar" onClick={() => voltar(voltarPara)} />
        ) : (
          <span className="w-2" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-zinc-50">{titulo}</h1>
          {subtitulo && <p className="-mt-0.5 truncate text-xs text-zinc-400">{subtitulo}</p>}
        </div>
        {acoes}
      </div>
    </header>
  );
}

export function Vazio({ icone, titulo, texto, children }: { icone: string; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 rounded-2xl bg-zinc-900 p-4 text-zinc-500 ring-1 ring-white/5">
        <Icone nome={icone} className="size-8" />
      </div>
      <p className="font-medium text-zinc-200">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-sm text-zinc-500">{texto}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Secao({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------- bottom sheet */

export function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
  rodape,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  useEffect(() => {
    if (!aberta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", esc);
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="animar-fade absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={aoFechar} />
      <div className="animar-subir relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-zinc-925 ring-1 ring-white/10 sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />
        <div className="flex items-center justify-between px-4 pb-1 pt-2">
          <h2 className="text-lg font-semibold text-zinc-50">{titulo}</h2>
          <BotaoIcone icone="fechar" rotulo="Fechar" onClick={aoFechar} />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {rodape && (
          <div className="border-t border-white/5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{rodape}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- toasts */

type Toast = { id: number; texto: string; tipo: "ok" | "erro" };
let toasts: Toast[] = [];
const ouvintesToast = new Set<() => void>();
const emitirToast = () => ouvintesToast.forEach((o) => o());

export function avisar(texto: string, tipo: Toast["tipo"] = "ok") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, texto, tipo }].slice(-2);
  emitirToast();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitirToast();
  }, tipo === "erro" ? 4500 : 2600);
}

/** Executa uma ação; mostra o erro em toast e retorna se deu certo. */
export function tentar(fn: () => void, sucesso?: string) {
  try {
    fn();
    if (sucesso) avisar(sucesso);
    return true;
  } catch (e) {
    avisar(e instanceof Error ? e.message : "Algo deu errado.", "erro");
    return false;
  }
}

const SEM_TOASTS: Toast[] = [];

export function Toasts() {
  const lista = useSyncExternalStore(
    (cb) => {
      ouvintesToast.add(cb);
      return () => ouvintesToast.delete(cb);
    },
    () => toasts,
    () => SEM_TOASTS
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[60] flex flex-col items-center gap-2 px-4">
      {lista.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx(
            "animar-fade flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-2xl shadow-black/50 ring-1",
            t.tipo === "ok" ? "bg-emerald-950 text-emerald-200 ring-emerald-500/30" : "bg-rose-950 text-rose-200 ring-rose-500/30"
          )}
        >
          <Icone nome={t.tipo === "ok" ? "check" : "alerta"} className="size-4 shrink-0" />
          {t.texto}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------- confirmação */

type PedidoConfirmacao = {
  titulo: string;
  texto: string;
  confirmar: string;
  perigo?: boolean;
  resolver: (ok: boolean) => void;
};
let pedido: PedidoConfirmacao | null = null;
const ouvintesConf = new Set<() => void>();

export function confirmar(opts: Omit<PedidoConfirmacao, "resolver" | "confirmar"> & { confirmar?: string }) {
  return new Promise<boolean>((resolver) => {
    pedido = { confirmar: "Confirmar", ...opts, resolver };
    ouvintesConf.forEach((o) => o());
  });
}

export function Confirmacoes() {
  const atual = useSyncExternalStore(
    (cb) => {
      ouvintesConf.add(cb);
      return () => ouvintesConf.delete(cb);
    },
    () => pedido,
    () => null
  );
  const responder = (ok: boolean) => {
    atual?.resolver(ok);
    pedido = null;
    ouvintesConf.forEach((o) => o());
  };
  return (
    <Folha aberta={!!atual} aoFechar={() => responder(false)} titulo={atual?.titulo ?? ""}>
      <p className="text-[15px] leading-relaxed text-zinc-300">{atual?.texto}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Botao variante="secundario" onClick={() => responder(false)}>
          Cancelar
        </Botao>
        <Botao variante={atual?.perigo ? "perigo" : "primario"} onClick={() => responder(true)}>
          {atual?.confirmar}
        </Botao>
      </div>
    </Folha>
  );
}
