export const soDigitos = (s: string | null | undefined) => (s || '').replace(/\D/g, '');
export const telValido = (t: string) => [10, 11].includes(soDigitos(t).length);
export const docValido = (d: string) => [0, 11, 14].includes(soDigitos(d).length);
export const mascaraTel = (s: string) => {
  const n = soDigitos(s).slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, n.length - 4)}-${n.slice(-4)}`;
};
export const mascaraDoc = (s: string) => {
  const n = soDigitos(s).slice(0, 14);
  if (n.length <= 11) return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return n.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
};
export async function buscaCep(cep: string): Promise<{ endereco: string; cidade: string } | null> {
  const n = soDigitos(cep);
  if (n.length !== 8) return null;
  try {
    const d = await (await fetch(`https://viacep.com.br/ws/${n}/json/`)).json();
    if (d.erro) return null;
    return { endereco: [d.logradouro, d.bairro].filter(Boolean).join(', '), cidade: [d.localidade, d.uf].filter(Boolean).join('/') };
  } catch {
    return null;
  }
}
