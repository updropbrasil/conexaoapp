'use client';
import { useState } from 'react';
import type { ClienteForm } from '@/lib/admin';
import type { Cliente } from '@/lib/types';
import { buscaCep, docValido, mascaraDoc, mascaraTel, telValido } from '@/lib/validacao';

export const vazio: ClienteForm = { nome: '', doc: '', ie: '', responsavel: '', tel: '', email: '', cep: '', endereco: '', cidade: '' };

/** Formulário de cliente (usado no cadastro público e no painel). */
export function FormCliente({ inicial, publico = false, onSalvar, botao, rodape }: { inicial?: Cliente | null; publico?: boolean; onSalvar: (d: ClienteForm) => Promise<void>; botao: string; rodape?: React.ReactNode }) {
  const [d, setD] = useState<ClienteForm>(inicial ? { ...vazio, ...Object.fromEntries(Object.entries(inicial).map(([k, v]) => [k, v ?? ''])) } as ClienteForm : vazio);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof ClienteForm, v: string) => setD((x) => ({ ...x, [k]: v }));

  const salvar = async () => {
    if (!d.nome?.trim()) return setErro('Informe o nome da loja/empresa.');
    if ((publico || d.tel) && !telValido(d.tel || '')) return setErro('WhatsApp inválido: use DDD + número.');
    if (!docValido(d.doc || '')) return setErro('CPF/CNPJ inválido: CPF tem 11 dígitos e CNPJ 14.');
    setErro('');
    setSalvando(true);
    try {
      const limpo = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as ClienteForm;
      await onSalvar(limpo);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const C = ({ k, rotulo, ...p }: { k: keyof ClienteForm; rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block">
      <span className="rotulo">{rotulo}</span>
      <input className="campo" value={(d[k] as string) ?? ''} onChange={(e) => set(k, e.target.value)} {...p} />
    </label>
  );
  return (
    <div className="space-y-3">
      {C({ k: 'nome', rotulo: 'Nome da loja / empresa', placeholder: 'Ex.: Armarinho Boa Vista' })}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="rotulo">CPF / CNPJ</span>
          <input className="campo num" inputMode="numeric" value={d.doc ?? ''} onChange={(e) => set('doc', mascaraDoc(e.target.value))} />
        </label>
        {C({ k: 'ie', rotulo: 'Inscrição estadual' })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {C({ k: 'responsavel', rotulo: publico ? 'Seu nome' : 'Contato' })}
        <label className="block">
          <span className="rotulo">WhatsApp</span>
          <input className="campo num" inputMode="tel" value={d.tel ?? ''} onChange={(e) => set('tel', mascaraTel(e.target.value))} placeholder="(83) 90000-0000" />
        </label>
      </div>
      {C({ k: 'email', rotulo: 'E-mail', type: 'email' })}
      <label className="block">
        <span className="rotulo">CEP</span>
        <input
          className="campo num"
          inputMode="numeric"
          maxLength={9}
          value={d.cep ?? ''}
          placeholder="Só números — preenche o endereço"
          onChange={async (e) => {
            set('cep', e.target.value);
            const r = await buscaCep(e.target.value);
            if (r) setD((x) => ({ ...x, endereco: r.endereco || x.endereco, cidade: r.cidade || x.cidade }));
          }}
        />
      </label>
      {C({ k: 'endereco', rotulo: 'Endereço' })}
      {C({ k: 'cidade', rotulo: 'Cidade/UF' })}
      {erro && <p className="rounded-xl bg-perigo-claro px-3 py-2 text-[13px] font-medium text-perigo">{erro}</p>}
      <div className="flex gap-2 pt-1">
        {rodape}
        <button onClick={salvar} disabled={salvando} className="btn-tinta flex-1">
          {salvando ? 'Salvando…' : botao}
        </button>
      </div>
    </div>
  );
}
