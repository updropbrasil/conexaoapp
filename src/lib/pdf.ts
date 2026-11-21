/* PDF do pedido (mesmo conteúdo do app antigo). Carregado só quando usado. */
import { dinheiro } from './formato';
import type { Cliente, Pedido } from './types';

export async function pdfPedido(p: Pedido, c: Cliente | undefined) {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const tot = p.pedido_itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  doc.setFont('helvetica', 'bold').setFontSize(17).setTextColor(15, 42, 71);
  doc.text('CONEXÃO · Indústria & Varejo', 40, 50);
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90, 90, 90);
  doc.text(`Pedido ${p.numero ?? ''}  ·  ${p.fornecedor ?? '—'}  ·  ${new Date(p.criado_em).toLocaleDateString('pt-BR')}`, 40, 68);
  let y = 92;
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(20, 20, 20);
  doc.text('Cliente: ' + p.cliente_nome, 40, y);
  doc.setFont('helvetica', 'normal').setFontSize(10);
  y += 15;
  const linhas = [
    [c?.doc && 'CPF/CNPJ: ' + c.doc, c?.ie && 'IE: ' + c.ie].filter(Boolean).join('   ·   '),
    [c?.endereco, c?.cidade, c?.cep && 'CEP ' + c.cep].filter(Boolean).join(' - '),
    [c?.tel && 'Tel: ' + c.tel, c?.email && 'E-mail: ' + c.email].filter(Boolean).join('   ·   '),
    p.transportadora ? 'Transportadora: ' + p.transportadora : '',
  ];
  for (const l of linhas) if (l) (doc.text(l, 40, y), (y += 14));
  autoTable(doc, {
    startY: y + 8,
    head: [['Produto', 'Ref.', 'Qtd', 'Unit.', 'Subtotal']],
    body: p.pedido_itens.map((i) => [i.produto_nome, i.ref || '—', String(i.qtd), dinheiro(i.preco), dinheiro(i.qtd * i.preco)]),
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [15, 42, 71] },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
  });
  const fim = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  doc.setFont('helvetica', 'bold').setFontSize(13).text('Total: ' + dinheiro(tot), 555, fim + 24, { align: 'right' });
  const nome = `Pedido-${(p.numero ?? '').replace('#', '')}-${p.cliente_nome.replace(/[^\w]+/g, '_')}.pdf`;
  const blob = doc.output('blob');
  try {
    const f = new File([blob], nome, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [f] })) return await navigator.share({ files: [f], title: 'Pedido ' + (p.numero ?? '') });
  } catch {}
  doc.save(nome);
}
