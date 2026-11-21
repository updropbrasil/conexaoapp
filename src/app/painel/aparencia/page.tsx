'use client';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/components/Admin';
import { Icone } from '@/components/Icone';
import { useLoja } from '@/components/Loja';
import { PainelTopo } from '@/components/PainelTopo';
import { enviarFoto } from '@/lib/fotos';
import { aplicarTema, carregarAparencia, salvarAparencia, TEMAS } from '@/lib/tema';

export default function Aparencia() {
  const { avisar, falhar } = useAdmin();
  const { recarregar } = useLoja();
  const [banner, setBanner] = useState('');
  const [tema, setTema] = useState('conexao');
  const [existe, setExiste] = useState(true);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    carregarAparencia().then(({ ap, tabelaExiste }) => {
      setBanner(ap.banner_url);
      setTema(ap.tema);
      setExiste(tabelaExiste);
    });
  }, []);
  const salvar = async (chave: 'banner_url' | 'tema', valor: string) => {
    try {
      await salvarAparencia(chave, valor);
      avisar('Aparência salva');
      recarregar();
    } catch (e) {
      falhar(e);
    }
  };
  return (
    <>
      <PainelTopo titulo="Aparência" sub="Banner e cor do catálogo" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        {!existe && (
          <p className="flex items-start gap-2 rounded-2xl bg-alerta-claro px-4 py-3 text-[13.5px] text-alerta">
            <Icone n="alerta" className="mt-0.5 size-4 shrink-0" /> A tabela de configuração ainda não foi criada no Supabase (arquivo supabase/migrations/001_config_e_fotos.sql). O catálogo usa o visual padrão até lá.
          </p>
        )}
        <section className="cartao p-4 sm:p-5">
          <h2 className="text-[16px] font-bold text-tinta">Cor principal</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {TEMAS.map((t) => (
              <button key={t.id} onClick={() => { setTema(t.id); aplicarTema(t.id); salvar('tema', t.id); }} className={`rounded-2xl p-2 text-[12.5px] font-semibold ring-2 transition ${tema === t.id ? 'ring-tinta' : 'ring-transparent'}`}>
                <span className="block h-12 rounded-xl" style={{ background: `linear-gradient(120deg, ${t.tinta}, ${t.marca})` }} />
                <span className="mt-1.5 block">{t.nome}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="cartao p-4 sm:p-5">
          <h2 className="text-[16px] font-bold text-tinta">Banner da página inicial</h2>
          <p className="mt-0.5 text-[12.5px] text-suave">Imagem larga (ex.: 1600×500). Aparece abaixo das categorias. Vazio = sem banner.</p>
          {banner && <img src={banner} alt="" className="mt-3 aspect-[3/1] w-full rounded-2xl object-cover" />}
          <div className="mt-3 flex gap-2">
            <label className="btn-claro flex-1 cursor-pointer">
              <Icone n="upload" /> {enviando ? 'Enviando…' : 'Enviar imagem'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                setEnviando(true);
                try {
                  const r = await enviarFoto('banner', f, 'config');
                  setBanner(r.url);
                  await salvar('banner_url', r.url);
                } catch (er) { falhar(er); } finally { setEnviando(false); }
              }} />
            </label>
            {banner && <button onClick={() => { setBanner(''); salvar('banner_url', ''); }} className="btn-claro px-4 text-perigo">Remover</button>}
          </div>
          <label className="mt-3 block"><span className="rotulo">ou cole o link da imagem</span>
            <div className="flex gap-2"><input className="campo" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://…" /><button onClick={() => salvar('banner_url', banner.trim())} className="btn-tinta shrink-0">Salvar</button></div>
          </label>
        </section>
      </div>
    </>
  );
}
