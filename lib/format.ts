const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const brl = (centavos: number) => moeda.format((centavos || 0) / 100);

export const qtd = (n: number) =>
  (n || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

function normalizarNumero(texto: string): number | null {
  const t = texto.replace(/[R$\s]/g, "");
  if (!t) return null;
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
  return Number.isFinite(n) ? n : null;
}

/** "12,50" → 1250 centavos */
export function parseValor(texto: string): number | null {
  const n = normalizarNumero(texto);
  return n === null ? null : Math.round(n * 100);
}

export function parseQtd(texto: string): number | null {
  const n = normalizarNumero(texto);
  return n === null ? null : Math.round(n * 1000) / 1000;
}

export const valorParaInput = (centavos: number) =>
  (centavos / 100).toFixed(2).replace(".", ",");

export const qtdParaInput = (n: number) => String(n).replace(".", ",");

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const dataHoraCompleta = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const dataCurta = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const chaveDia = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function rotuloDia(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (chaveDia(iso) === chaveDia(hoje.toISOString())) return "Hoje";
  if (chaveDia(iso) === chaveDia(ontem.toISOString())) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    ...(d.getFullYear() !== hoje.getFullYear() ? { year: "numeric" } : {}),
  });
}

export const ehHoje = (iso: string) => chaveDia(iso) === chaveDia(new Date().toISOString());

export function slug(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "loja"
  );
}
