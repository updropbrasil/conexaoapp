import type { StatusPedido } from './types';
export const STATUS: Record<StatusPedido, { t: string; cls: string; ponto: string }> = {
  aberto: { t: 'Em aberto', cls: 'bg-[#fff4d6] text-[#8a5a00]', ponto: '#e0a100' },
  separacao: { t: 'Em separação', cls: 'bg-marca-claro text-marca', ponto: '#1b4f8a' },
  faturado: { t: 'Faturado', cls: 'bg-[#efe9fb] text-[#5b3a9b]', ponto: '#6d4bc2' },
  enviado: { t: 'Enviado', cls: 'bg-[#e3f4f6] text-[#0e6470]', ponto: '#0e8392' },
  entregue: { t: 'Entregue', cls: 'bg-folha-claro text-[#2c6a1c]', ponto: '#3f8f2a' },
  cancelado: { t: 'Cancelado', cls: 'bg-perigo-claro text-perigo', ponto: '#b42318' },
};
export const FLUXO: StatusPedido[] = ['aberto', 'separacao', 'faturado', 'enviado', 'entregue'];
