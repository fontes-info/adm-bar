export type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito" | "outro";

export type TipoMovimento =
  | "cadastro"
  | "produto_criado"
  | "produto_editado"
  | "produto_excluido"
  | "entrada"
  | "saida"
  | "ajuste"
  | "venda"
  | "estorno"
  | "abertura"
  | "fechamento"
  | "suprimento"
  | "sangria"
  | "despesa"
  | "loja_editada"
  | "dados_importados";

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  codigo: string;
  /** valores monetários em centavos */
  precoVenda: number;
  custo: number;
  quantidade: number;
  estoqueMinimo: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemMovimento {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnit: number;
  estoqueAntes: number;
  estoqueDepois: number;
}

export interface Movimento {
  id: string;
  tipo: TipoMovimento;
  criadoEm: string;
  descricao?: string;
  descricaoEditadaEm?: string;
  produtoId?: string;
  produtoNome?: string;
  quantidade?: number;
  estoqueAntes?: number;
  estoqueDepois?: number;
  itens?: ItemMovimento[];
  /** centavos, sempre positivo; o sinal vem do tipo */
  valor?: number;
  formaPagamento?: FormaPagamento;
  sessaoId?: string;
  /** venda estornada → id do estorno; estorno → id da venda */
  refId?: string;
  esperado?: number;
  contado?: number;
  alteracoes?: string[];
}

export interface SessaoCaixa {
  id: string;
  abertoEm: string;
  saldoInicial: number;
}

export interface Loja {
  nome: string;
  responsavel: string;
  criadoEm: string;
}

export interface Dados {
  app: "adm-bar";
  versao: 1;
  loja: Loja;
  produtos: Produto[];
  movimentos: Movimento[];
  caixa: { sessao: SessaoCaixa | null };
}
