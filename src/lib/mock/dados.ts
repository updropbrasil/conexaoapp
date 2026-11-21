/*
 * Dados de exemplo (modo de teste). Nada daqui vai para o banco.
 * Produtos/categorias inspirados no catálogo real; clientes e pedidos são FICTÍCIOS.
 * Fotos: ilustrações geradas por scripts/gerar-fotos-mock.mjs (1200px + miniatura 300px, WebP).
 */
import type { Cliente, Cotacao, Fornecedor, Pedido, PedidoItem, Produto, StatusPedido } from '../types';

export const fornecedores: Fornecedor[] = [
  { id: 'f-cmb', nome: 'Cama, Mesa e Banho', logo: '🛏️', cor: 0, pedido_minimo: 1500 },
  { id: 'f-fit', nome: 'Esporte Fitness', logo: '🏃', cor: 1, pedido_minimo: 800 },
  { id: 'f-praia', nome: 'Moda Praia', logo: '👙', cor: 2, pedido_minimo: 600 },
  { id: 'f-ud', nome: 'Utilidades Domésticas', logo: '🏠', cor: 3, pedido_minimo: null },
  { id: 'f-moda', nome: 'Moda Masculina e Feminina', logo: '👕', cor: 4, pedido_minimo: null },
  { id: 'f-int', nome: 'Moda Íntima e Meias', logo: '🧦', cor: 5, pedido_minimo: null },
  { id: 'f-tec', nome: 'Tecidos no Atacado', logo: '🧵', cor: 6, pedido_minimo: null },
  { id: 'f-ele', nome: 'Eletrônicos e Acessórios', logo: '🎧', cor: 7, pedido_minimo: null },
  { id: 'f-fer', nome: 'Ferramentas e Acessórios', logo: '🔧', cor: 8, pedido_minimo: null },
];

const foto = (id: string, n: number) => `/mock/fotos/${id}-${n}.webp`;

interface Def {
  id: string;
  f: string;
  nome: string;
  ref?: string;
  preco: number;
  min: number;
  custo?: number;
  cat?: string;
  fotos?: number;
  vars?: [string, number][];
  faixas?: [number, number][];
  novo?: boolean;
}

const defs: Def[] = [
  { id: 'cob-estampado-casal', f: 'f-cmb', nome: 'Cobertor Microfibra Estampado — Casal 1,80x2,00', ref: 'COB-LISO-CAS', preco: 16, min: 40, custo: 12.3, cat: 'Cobertores', fotos: 3, faixas: [[3000, 15.2], [6000, 14.5]] },
  { id: 'cob-canelado-casal', f: 'f-cmb', nome: 'Cobertor Microfibra Canelado — Casal 1,80x2,00 Liso', ref: 'COB-CAN-CAS', preco: 20, min: 40, custo: 15.4, cat: 'Cobertores', fotos: 3, faixas: [[3000, 19], [6000, 18.2]] },
  { id: 'cob-rolinho', f: 'f-cmb', nome: 'Cobertor Microfibra Rolinho Liso 180x200', ref: 'COB-ROL-180', preco: 16, min: 40, custo: 12, cat: 'Cobertores', fotos: 2 },
  { id: 'cob-baby-kit', f: 'f-cmb', nome: 'Cobertor Microfibra Baby — Kit c/2 0,90x1,00', ref: 'COB-BABY-KIT2', preco: 8, min: 120, custo: 6, cat: 'Infantil', fotos: 2, vars: [['Azul', 8], ['Rosa', 8]] },
  { id: 'manta-cereja', f: 'f-cmb', nome: 'Manta Cereja Casal 180x200', ref: 'MAN-CER-180', preco: 22, min: 40, custo: 16.9, cat: 'Mantas', fotos: 2, novo: true },
  { id: 'manta-poa', f: 'f-cmb', nome: 'Manta Casal Poá 180x200 Rolinho', ref: 'MAN-POA-180', preco: 18, min: 40, custo: 13.8, cat: 'Mantas', fotos: 1 },
  { id: 'manta-grid', f: 'f-cmb', nome: 'Manta Grid 180x240', ref: 'MAN-GRID-240', preco: 22, min: 30, custo: 16.9, cat: 'Mantas', fotos: 1 },
  { id: 'travesseiro-sublime', f: 'f-cmb', nome: 'Travesseiro Sublime 70x50', ref: 'TRV-SUB-70', preco: 16, min: 30, custo: 12.3, cat: 'Travesseiros', fotos: 2 },
  { id: 'fronha-kit4', f: 'f-cmb', nome: 'Fronha — Kit c/4 48x68', ref: 'FRO-KIT4', preco: 16, min: 30, custo: 12.3, cat: 'Travesseiros', fotos: 1 },
  { id: 'lencol-elastico-casal', f: 'f-cmb', nome: 'Lençol de Elástico — Casal 1,90x1,45x0,30', ref: 'LEN-EL-CAS', preco: 17, min: 30, custo: 13, cat: 'Lençóis', fotos: 2 },
  { id: 'lencol-elastico-queen', f: 'f-cmb', nome: 'Lençol de Elástico — Queen 2,10x2,00', ref: 'LEN-EL-QUE', preco: 18, min: 30, custo: 13.8, cat: 'Lençóis', fotos: 1 },
  { id: 'pano-prato', f: 'f-cmb', nome: 'Pano de Prato 45x75 (dúzia)', ref: 'PAN-PR-DZ', preco: 22, min: 35, custo: 16.9, cat: 'Cozinha', fotos: 1 },
  { id: 'tapete-seda', f: 'f-cmb', nome: 'Tapete Fio de Seda 50x75 Importado', ref: 'TAP-SED-50', preco: 20, min: 25, custo: 15.4, cat: 'Tapetes', fotos: 2 },
  { id: 'tapete-pesinho', f: 'f-cmb', nome: 'Tapete de Pezinho 40x60', ref: 'TAP-PEZ-40', preco: 3.5, min: 300, custo: 2.7, cat: 'Tapetes', fotos: 1 },
  { id: 'short-fitness', f: 'f-fit', nome: 'Short Fitness Feminino Duplo em Poliamida com Bolso', ref: 'SHT-FIT-DUP', preco: 30, min: 30, custo: 23, cat: 'Feminino', fotos: 3, vars: [['P', 30], ['M', 30], ['G', 30], ['GG', 32]] },
  { id: 'conjunto-dryfit', f: 'f-fit', nome: 'Conjunto Dry Fit Tecido Grão de Arroz', ref: 'CJ-DRY-GA', preco: 28, min: 30, custo: 21.5, cat: 'Masculino', fotos: 2, vars: [['P', 28], ['M', 28], ['G', 28], ['GG', 30]], novo: true },
  { id: 'regata-dryfit', f: 'f-fit', nome: 'Regata Dry-Fit Tecido Grão de Arroz', ref: 'REG-DRY-GA', preco: 12, min: 30, custo: 9.2, cat: 'Masculino', fotos: 1, vars: [['P', 12], ['M', 12], ['G', 12], ['GG', 13]] },
  { id: 'calca-poliamida', f: 'f-fit', nome: 'Calça Masculina em Poliamida com Elastano', ref: 'CAL-POL-M', preco: 28, min: 30, custo: 21.5, cat: 'Masculino', fotos: 1 },
  { id: 'camiseta-uv', f: 'f-fit', nome: 'Camiseta Proteção Solar UV', ref: 'CAM-UV', preco: 16, min: 30, custo: 12.3, cat: 'Unissex', fotos: 2, vars: [['M', 16], ['G', 16], ['GG', 17]] },
  { id: 'camisa-colmeia', f: 'f-fit', nome: 'Camisa Dry Fit Tecido Colmeia', ref: 'CAM-COLM', preco: 14, min: 30, custo: 10.8, cat: 'Unissex', fotos: 1 },
  { id: 'bone-liso', f: 'f-fit', nome: 'Boné Aba Curva Ajustável', ref: 'BON-AC', preco: 22, min: 30, custo: 16.9, cat: 'Acessórios', fotos: 2 },
  { id: 'saida-zigue', f: 'f-praia', nome: 'Saída de Praia Curta em Zigue-Zague com Franjas', ref: 'SAI-ZZ', preco: 16, min: 30, custo: 12.3, cat: 'Saídas', fotos: 1 },
  { id: 'vestido-croche', f: 'f-praia', nome: 'Vestido Curto de Crochê para Saída de Praia', ref: 'VES-CRO', preco: 25, min: 30, custo: 19.2, cat: 'Saídas', fotos: 2, novo: true },
  { id: 'top-croche', f: 'f-praia', nome: 'Top de Crochê Feminino Tamanho Único', ref: 'TOP-CRO', preco: 18, min: 30, custo: 13.8, cat: 'Tops', fotos: 1 },
  { id: 'chapeu-croche', f: 'f-praia', nome: 'Chapéu em Crochê Tamanho Único', ref: 'CHA-CRO', preco: 28, min: 30, custo: 21.5, cat: 'Acessórios', fotos: 1 },
  { id: 'short-croche', f: 'f-praia', nome: 'Short de Crochê Branco para Saída de Praia', ref: 'SHT-CRO', preco: 16, min: 30, custo: 12.3, cat: 'Saídas', fotos: 1 },
  { id: 'cabide-aveludado', f: 'f-ud', nome: 'Cabide Preto Aveludado com Gancho Metálico', ref: 'CAB-AVE', preco: 2.2, min: 200, custo: 1.7, cat: 'Cabides', fotos: 1, faixas: [[1000, 2.05]] },
  { id: 'cabide-prendedor', f: 'f-ud', nome: 'Cabide Multiuso com 10 Prendedores', ref: 'CAB-10P', preco: 5.2, min: 100, custo: 4, cat: 'Cabides', fotos: 1 },
  { id: 'organizador-gaveta', f: 'f-ud', nome: 'Organizador de Gaveta 24 Compartimentos', ref: 'ORG-24', preco: 7.8, min: 100, custo: 6, cat: 'Organização', fotos: 1 },
  { id: 'caixa-pied', f: 'f-ud', nome: 'Caixa Organizadora de Tecido Pied-de-Poule', ref: 'CX-PIED', preco: 11.8, min: 100, custo: 9.1, cat: 'Organização', fotos: 1 },
];

export const produtos: Produto[] = defs.map((d, i) => {
  const n = d.fotos ?? 0;
  return {
    id: d.id,
    fornecedor_id: d.f,
    nome: d.nome,
    ref: d.ref ?? null,
    preco: d.preco,
    emoji: null,
    img_url: n ? foto(d.id, 1) : null,
    min_mult: d.min,
    custo: d.custo ?? null,
    margem_tipo: 'pct',
    margem_val: 30,
    categoria: d.cat ?? null,
    criado_em: new Date(Date.UTC(2026, 10, 20 - (d.novo ? 0 : 5 + i))).toISOString(),
    produto_fotos: Array.from({ length: n }, (_, k) => ({ id: `${d.id}-f${k + 1}`, produto_id: d.id, url: foto(d.id, k + 1), ordem: k })),
    produto_variacoes: (d.vars ?? []).map(([nome, preco], k) => ({ id: `${d.id}-v${k}`, produto_id: d.id, nome, ref: d.ref ? `${d.ref}-${nome}`.toUpperCase() : null, preco })),
    produto_faixas: (d.faixas ?? []).map(([min_valor, preco], k) => ({ id: `${d.id}-x${k}`, produto_id: d.id, min_valor, preco })),
  };
});

export const NOVOS = new Set(defs.filter((d) => d.novo).map((d) => d.id));

/* ---------- área logada (FICTÍCIO) ---------- */

export const clientes: Cliente[] = [
  ['Armarinho Boa Vista', 'Marta Lins', 'João Pessoa/PB', true],
  ['Loja Estrela do Mar', 'Paulo Henrique', 'Cabedelo/PB', true],
  ['Bazar Dois Irmãos', 'Rita Araújo', 'Campina Grande/PB', true],
  ['Magazine Primavera', 'Célia Moura', 'Santa Rita/PB', true],
  ['Empório Sol Nascente', 'Jonas Freitas', 'Bayeux/PB', false],
  ['Casa & Conforto Enxovais', 'Lúcia Brito', 'Recife/PE', true],
  ['Fit Point Moda Esportiva', 'Diego Ramos', 'Natal/RN', false],
  ['Variedades Central', 'Ana Paula Melo', 'Guarabira/PB', true],
  ['Mercadinho Bom Preço', 'Severino Costa', 'Conde/PB', false],
  ['Ateliê Maré Alta', 'Fernanda Rocha', 'Pitimbu/PB', true],
].map(([nome, resp, cidade, ja], i) => ({
  id: `c${i + 1}`,
  nome: nome as string,
  responsavel: resp as string,
  cidade: cidade as string,
  ja_pediu: ja as boolean,
  doc: `00.000.000/0001-${String(10 + i).padStart(2, '0')}`,
  ie: null,
  tel: `(83) 90000-00${String(10 + i)}`,
  email: null,
  cep: null,
  endereco: null,
  criado_em: new Date(Date.UTC(2026, 9, 2 + i * 4)).toISOString(),
}));

const fn = (id: string) => fornecedores.find((f) => f.id === id)!.nome;
const pr = (id: string) => produtos.find((p) => p.id === id)!;

function itens(pid: string, lista: [string, number, string?][]): PedidoItem[] {
  return lista.map(([prod, qtd, varNome], k) => {
    const p = pr(prod);
    const v = varNome ? p.produto_variacoes.find((x) => x.nome === varNome) : undefined;
    return {
      id: `${pid}-i${k}`,
      pedido_id: pid,
      produto_nome: p.nome + (v ? ` (${v.nome})` : ''),
      ref: v?.ref ?? p.ref,
      fornecedor: fn(p.fornecedor_id),
      qtd,
      preco: v?.preco ?? p.preco ?? 0,
      custo: p.custo,
    };
  });
}

const pedDefs: [string, string, StatusPedido, number, [string, number, string?][], string?][] = [
  ['#1084', 'Casa & Conforto Enxovais', 'aberto', 0, [['cob-estampado-casal', 80], ['travesseiro-sublime', 60], ['fronha-kit4', 30]]],
  ['#1083', 'Fit Point Moda Esportiva', 'separacao', 1, [['short-fitness', 30, 'M'], ['short-fitness', 30, 'G'], ['conjunto-dryfit', 30, 'G'], ['regata-dryfit', 60, 'M']]],
  ['#1082', 'Loja Estrela do Mar', 'faturado', 2, [['vestido-croche', 30], ['saida-zigue', 30], ['chapeu-croche', 30]], 'Braspress'],
  ['#1081', 'Armarinho Boa Vista', 'enviado', 4, [['cabide-aveludado', 400], ['cabide-prendedor', 100], ['organizador-gaveta', 100]], 'Jadlog'],
  ['#1080', 'Bazar Dois Irmãos', 'entregue', 6, [['cob-canelado-casal', 40], ['manta-cereja', 40], ['lencol-elastico-casal', 30]]],
  ['#1079', 'Magazine Primavera', 'entregue', 9, [['cob-baby-kit', 120, 'Azul'], ['tapete-pesinho', 300]]],
  ['#1078', 'Variedades Central', 'entregue', 12, [['pano-prato', 35], ['tapete-seda', 25]]],
  ['#1077', 'Ateliê Maré Alta', 'cancelado', 15, [['top-croche', 30]]],
];

const hoje = new Date(Date.UTC(2026, 10, 21, 13));
export const pedidos: Pedido[] = pedDefs.map(([numero, cli, status, dias, lista, transp], i) => {
  const id = `pd${i + 1}`;
  const its = itens(id, lista);
  const criado = new Date(hoje.getTime() - dias * 864e5);
  const tot = its.reduce((a, x) => a + x.qtd * x.preco, 0);
  const com = its.reduce((a, x) => a + (x.custo != null ? (x.preco - x.custo) * x.qtd : 0), 0);
  const parcelas =
    status === 'aberto' || status === 'cancelado'
      ? []
      : [1, 2, 3].map((n) => ({
          id: `${id}-p${n}`,
          pedido_id: id,
          numero: n,
          total: 3,
          vencimento: new Date(criado.getTime() + n * 30 * 864e5).toISOString().slice(0, 10),
          valor: Math.round((tot / 3) * 100) / 100,
          comissao: Math.round((com / 3) * 100) / 100,
          recebido: status === 'entregue' && n === 1,
          recebido_em: null,
        }));
  return {
    id,
    numero,
    cliente_nome: cli,
    fornecedor: its[0]?.fornecedor ?? null,
    status,
    data: criado.toISOString().slice(0, 10),
    criado_em: criado.toISOString(),
    vencimento: null,
    transportadora: transp ?? null,
    recebido: false,
    pedido_itens: its,
    parcelas,
  };
});

export const cotacoes: Cotacao[] = [];
