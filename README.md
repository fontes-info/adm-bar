# Adm Bar — Estoque e Caixa

Aplicativo mobile-first, tema escuro, para controle de **estoque** e **caixa** de bares e pequenos comércios.
Funciona 100% no navegador, sem backend: os dados ficam no `localStorage` do aparelho.

## Funcionalidades

- **Primeiro acesso**: cadastro do responsável, nome da loja e senha opcional, ou importação de um backup `.json`.
- **Senha de acesso**: quando cadastrada, é pedida ao abrir o sistema e pode ser adicionada, alterada ou removida na aba *Loja*. Fica neste aparelho como hash PBKDF2 com sal, não vai no backup e exige HTTPS ou localhost.
- **Categorias**: lista gerenciada na aba *Loja*, com Bebidas alcoólicas, Bebidas, Refrigerantes e Comida como padrão. Categorias sem produtos podem ser excluídas.
- **Estoque (CRUD)**: cadastrar, editar e excluir produtos (categoria, unidade, preço, custo, estoque mínimo, código); entrada, saída e ajuste de quantidade; alertas de estoque baixo; busca, filtros e ordenação.
- **Caixa**: abertura com troco inicial, vendas com carrinho (baixa automática de estoque, cálculo de troco, forma de pagamento), suprimento, sangria, despesa, estorno de venda e fechamento com conferência (sobra/falta).
- **Linha do tempo**: toda ação gera uma movimentação com dia e horário, agrupada por dia, no histórico geral e na tela de cada produto. Cada movimentação tem uma tela de detalhes.
- **Descrição opcional** em todas as ações, para explicar o motivo, e que pode ser adicionada ou editada depois.
- **Exportar / Importar** backup completo em JSON (na aba *Loja* ou na tela de boas-vindas).

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:3000 (de preferência no celular ou no modo responsivo do navegador).
