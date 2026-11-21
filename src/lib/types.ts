/* Tipos espelhando o schema real do Supabase (13 tabelas). Campos opcionais = colunas que aceitam null. */

export interface Fornecedor {
  id: string;
  nome: string;
  logo: string | null; // emoji
  cor: number | null; // índice da paleta de cores (ver CORES_CATEGORIA)
  pedido_minimo: number | null;
  criado_em?: string;
}

export interface ProdutoVariacao {
  id: string;
  produto_id: string;
  nome: string;
  ref: string | null;
  preco: number;
}

export interface ProdutoFaixa {
  id: string;
  produto_id: string;
  min_valor: number; // valor do pedido (no fornecedor) a partir do qual vale o preço
  preco: number;
}

export interface ProdutoFoto {
  id: string;
  produto_id: string;
  url: string;
  ordem: number;
}

export interface Produto {
  id: string;
  fornecedor_id: string;
  nome: string;
  ref: string | null;
  preco: number | null;
  emoji: string | null;
  img_url: string | null; // capa (1200px WebP). Miniatura = mesmo caminho com sufixo -300
  min_mult: number | null;
  custo: number | null;
  margem_tipo: 'pct' | 'fix' | null;
  margem_val: number | null;
  categoria: string | null;
  criado_em?: string;
  produto_variacoes: ProdutoVariacao[];
  produto_faixas: ProdutoFaixa[];
  produto_fotos: ProdutoFoto[];
}

export interface Cliente {
  id: string;
  nome: string;
  doc: string | null;
  ie: string | null;
  responsavel: string | null;
  tel: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  ja_pediu: boolean;
  criado_em: string;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_nome: string;
  ref: string | null;
  fornecedor: string | null;
  qtd: number;
  preco: number;
  custo: number | null;
}

export type StatusPedido = 'aberto' | 'separacao' | 'faturado' | 'enviado' | 'entregue' | 'cancelado';

export interface Parcela {
  id: string;
  pedido_id: string;
  numero: number;
  total: number;
  vencimento: string | null;
  valor: number;
  comissao: number;
  recebido: boolean;
  recebido_em: string | null;
}

export interface Pedido {
  id: string;
  numero: string | null;
  cliente_nome: string;
  fornecedor: string | null;
  status: StatusPedido;
  data: string | null;
  criado_em: string;
  vencimento: string | null;
  transportadora: string | null;
  recebido: boolean;
  pedido_itens: PedidoItem[];
  parcelas: Parcela[];
}

export interface CotacaoItem {
  id: string;
  cotacao_id: string;
  produto_nome: string;
  ref: string | null;
  fornecedor: string | null;
  qtd: number;
  preco: number;
}

export interface Cotacao {
  id: string;
  cliente_nome: string;
  cliente_tel: string | null;
  status: 'pendente' | 'fechar' | 'pedido'; // 'fechar' = cliente clicou "Fazer pedido" no catálogo
  criado_em: string;
  cotacao_itens: CotacaoItem[];
}

export interface Lancamento {
  id: string;
  descricao: string | null;
  cliente_nome: string | null;
  pedido_numero: string | null;
  valor: number;
  comissao: number;
  vencimento: string | null;
  recebido: boolean;
  recebido_em: string | null;
}
