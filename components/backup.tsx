"use client";

import { useRef } from "react";
import { exportar, importar, validarDados } from "@/lib/store";
import { slug } from "@/lib/format";
import { Botao, avisar, confirmar, tentar } from "./ui";

export function baixarBackup() {
  tentar(() => {
    const dados = exportar();
    const json = JSON.stringify({ ...dados, exportadoEm: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const carimbo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `adm-bar_${slug(dados.loja.nome)}_${carimbo}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "Backup exportado");
}

export function BotaoImportar({
  className,
  variante = "secundario",
  substituindo = false,
}: {
  className?: string;
  variante?: "primario" | "secundario";
  /** já existem dados neste navegador */
  substituindo?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  const aoEscolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    try {
      const texto = await arquivo.text();
      const dados = validarDados(JSON.parse(texto));
      const ok = await confirmar({
        titulo: substituindo ? "Substituir dados atuais?" : "Importar backup?",
        texto: `Loja "${dados.loja.nome}" com ${dados.produtos.length} produto(s) e ${dados.movimentos.length} movimentação(ões).${
          substituindo ? " Todos os dados atuais deste navegador serão substituídos. Considere exportar um backup antes." : ""
        }`,
        confirmar: substituindo ? "Substituir" : "Importar",
        perigo: substituindo,
      });
      if (!ok) return;
      tentar(() => importar(dados, arquivo.name), "Backup importado com sucesso");
    } catch (err) {
      avisar(err instanceof SyntaxError ? "O arquivo não é um JSON válido." : err instanceof Error ? err.message : "Falha ao importar.", "erro");
    }
  };

  return (
    <>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={aoEscolher} />
      <Botao variante={variante} icone="importar" className={className} onClick={() => input.current?.click()}>
        Importar backup
      </Botao>
    </>
  );
}
