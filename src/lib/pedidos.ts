import type { Pedido } from './types';
export const valorPedido = (p: Pedido) => p.pedido_itens.reduce((a, i) => a + i.qtd * i.preco, 0);
export const comissaoPedido = (p: Pedido) => p.pedido_itens.reduce((a, i) => a + (i.custo != null ? (i.preco - i.custo) * i.qtd : 0), 0);
export const unidadesPedido = (p: Pedido) => p.pedido_itens.reduce((a, i) => a + i.qtd, 0);
