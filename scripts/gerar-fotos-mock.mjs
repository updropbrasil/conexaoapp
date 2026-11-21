// Gera as "fotos" ilustrativas do modo de teste (mock) em public/mock/fotos.
// Mesmo padrão que o app vai usar no upload real: grande 1200px WebP q0.8 + miniatura 300px WebP.
// Uso: node scripts/gerar-fotos-mock.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'public/mock/fotos');
mkdirSync(OUT, { recursive: true });

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('');
};

function padrao(id, tipo, c) {
  const a = shade(c, 0.35);
  switch (tipo) {
    case 'listra':
      return `<pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(0)"><rect width="60" height="60" fill="${c}"/><rect width="60" height="18" fill="${a}"/></pattern>`;
    case 'xadrez':
      return `<pattern id="${id}" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="${c}"/><rect width="40" height="80" fill="${a}" opacity=".5"/><rect width="80" height="40" fill="${a}" opacity=".5"/></pattern>`;
    case 'poa':
      return `<pattern id="${id}" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="${c}"/><circle cx="14" cy="14" r="7" fill="#fff" opacity=".75"/><circle cx="42" cy="42" r="7" fill="#fff" opacity=".75"/></pattern>`;
    case 'canelado':
      return `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="${c}"/><rect width="10" height="26" fill="${shade(c, -0.12)}"/></pattern>`;
    case 'croche':
      return `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${c}"/><circle cx="20" cy="20" r="11" fill="none" stroke="${shade(c, -0.18)}" stroke-width="4"/><circle cx="0" cy="0" r="6" fill="${shade(c, -0.1)}"/><circle cx="40" cy="40" r="6" fill="${shade(c, -0.1)}"/></pattern>`;
    case 'estrela':
      return `<pattern id="${id}" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="${c}"/><path d="M45 25l6 14 15 1-12 9 4 15-13-8-13 8 4-15-12-9 15-1z" fill="#fde68a" opacity=".9"/></pattern>`;
    case 'cereja':
      return `<pattern id="${id}" width="110" height="110" patternUnits="userSpaceOnUse"><rect width="110" height="110" fill="${c}"/><circle cx="40" cy="62" r="12" fill="#dc2626"/><circle cx="62" cy="68" r="12" fill="#dc2626"/><path d="M40 50 Q50 25 66 22 M62 56 Q60 35 66 22" stroke="#166534" stroke-width="4" fill="none"/></pattern>`;
    case 'pied':
      return `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f5f5f4"/><path d="M0 0h20v10h10v10H20v20H10V20H0z" fill="#1c1917"/></pattern>`;
    default:
      return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${c}"/></pattern>`;
  }
}

// cada desenho recebe a cor base e o fill do padrão; desenhado num quadro 1200x1200, centro ~ (600,620)
const DESENHOS = {
  dobrado: (c, f) => {
    let s = '';
    for (let i = 3; i >= 0; i--) {
      const y = 430 + i * 95;
      s += `<rect x="290" y="${y}" width="620" height="110" rx="46" fill="${f}"/>`;
      s += `<rect x="290" y="${y}" width="620" height="110" rx="46" fill="url(#luz)"/>`;
      s += `<path d="M330 ${y + 96} Q600 ${y + 118} 870 ${y + 96}" stroke="${shade(c, -0.25)}" stroke-width="5" fill="none" opacity=".5"/>`;
    }
    s += `<rect x="560" y="420" width="80" height="420" fill="${shade(c, 0.6)}" opacity=".9"/><rect x="560" y="560" width="80" height="120" rx="8" fill="#fff"/><rect x="574" y="590" width="52" height="8" rx="4" fill="#94a3b8"/><rect x="574" y="610" width="40" height="8" rx="4" fill="#cbd5e1"/>`;
    return s;
  },
  rolinho: (c, f) => {
    let s = '';
    [[430, 470], [770, 470], [600, 690]].forEach(([x, y]) => {
      s += `<circle cx="${x}" cy="${y}" r="165" fill="${f}"/><circle cx="${x}" cy="${y}" r="165" fill="url(#luz)"/>`;
      for (let r = 140; r > 20; r -= 32) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${shade(c, -0.22)}" stroke-width="6" opacity=".55"/>`;
    });
    return s;
  },
  travesseiro: (c, f) =>
    `<path d="M250 470 Q240 380 330 390 Q600 350 870 390 Q960 380 950 470 Q980 620 950 770 Q960 860 870 850 Q600 890 330 850 Q240 860 250 770 Q220 620 250 470Z" fill="${f}"/><path d="M250 470 Q240 380 330 390 Q600 350 870 390 Q960 380 950 470 Q980 620 950 770 Q960 860 870 850 Q600 890 330 850 Q240 860 250 770 Q220 620 250 470Z" fill="url(#luz)"/><path d="M300 440 Q600 410 900 440 Q930 620 900 800 Q600 830 300 800 Q270 620 300 440Z" fill="none" stroke="${shade(c, -0.15)}" stroke-width="6" stroke-dasharray="14 12"/>`,
  fronha: (c, f) =>
    `<g transform="translate(20 -60) scale(.88) translate(-60 0)">${DESENHOS.travesseiro(c, f)}</g><g transform="translate(130 150) scale(.88)">${DESENHOS.travesseiro(shade(c, -0.04), f)}</g>`,
  tapete: (c, f) => {
    let franja = '';
    for (let x = 250; x <= 950; x += 22) franja += `<line x1="${x}" y1="840" x2="${x - 6}" y2="890" stroke="${shade(c, 0.4)}" stroke-width="6"/><line x1="${x}" y1="380" x2="${x + 6}" y2="335" stroke="${shade(c, 0.4)}" stroke-width="6"/>`;
    return `${franja}<path d="M260 380 L940 380 L1000 840 L200 840Z" fill="${f}"/><path d="M260 380 L940 380 L1000 840 L200 840Z" fill="url(#luz)"/><path d="M320 430 L880 430 L925 790 L275 790Z" fill="none" stroke="${shade(c, 0.45)}" stroke-width="12"/>`;
  },
  pano: (c, f) =>
    `<rect x="330" y="330" width="540" height="600" rx="18" fill="#fff" transform="rotate(-6 600 630)"/><rect x="300" y="300" width="560" height="620" rx="18" fill="${f}" transform="rotate(4 600 600)"/><rect x="300" y="300" width="560" height="620" rx="18" fill="url(#luz)" transform="rotate(4 600 600)"/><rect x="300" y="380" width="560" height="26" fill="#fff" opacity=".8" transform="rotate(4 600 600)"/><rect x="300" y="820" width="560" height="26" fill="#fff" opacity=".8" transform="rotate(4 600 600)"/>`,
  camiseta: (c, f) =>
    `<path d="M470 300 Q600 360 730 300 L930 390 L870 540 L800 510 L800 930 L400 930 L400 510 L330 540 L270 390Z" fill="${f}"/><path d="M470 300 Q600 360 730 300 L930 390 L870 540 L800 510 L800 930 L400 930 L400 510 L330 540 L270 390Z" fill="url(#luz)"/><path d="M490 305 Q600 400 710 305" fill="none" stroke="${shade(c, -0.3)}" stroke-width="14"/>`,
  regata: (c, f) =>
    `<path d="M470 290 Q600 420 730 290 L760 300 Q760 430 820 500 L820 930 L380 930 L380 500 Q440 430 440 300Z" fill="${f}"/><path d="M470 290 Q600 420 730 290 L760 300 Q760 430 820 500 L820 930 L380 930 L380 500 Q440 430 440 300Z" fill="url(#luz)"/>`,
  short: (c, f) =>
    `<path d="M360 380 L840 380 L900 820 L640 840 L600 600 L560 840 L300 820Z" fill="${f}"/><path d="M360 380 L840 380 L900 820 L640 840 L600 600 L560 840 L300 820Z" fill="url(#luz)"/><rect x="360" y="380" width="480" height="70" fill="${shade(c, -0.2)}"/><path d="M560 420 Q600 470 640 420" stroke="#fff" stroke-width="6" fill="none"/>`,
  calca: (c, f) =>
    `<path d="M410 230 L790 230 L850 960 L660 960 L600 470 L540 960 L350 960Z" fill="${f}"/><path d="M410 230 L790 230 L850 960 L660 960 L600 470 L540 960 L350 960Z" fill="url(#luz)"/><rect x="410" y="230" width="380" height="60" fill="${shade(c, -0.2)}"/>`,
  conjunto: (c, f) =>
    `<g transform="translate(-60 -10) scale(.8)">${'<path d="M470 290 Q600 420 730 290 L760 300 Q760 430 820 500 L820 760 L380 760 L380 500 Q440 430 440 300Z" fill="FILL"/><path d="M470 290 Q600 420 730 290 L760 300 Q760 430 820 500 L820 760 L380 760 L380 500 Q440 430 440 300Z" fill="url(#luz)"/>'.replace('FILL', f)}</g><g transform="translate(260 170) scale(.7)">${DESENHOS.short(c, f)}</g>`,
  top: (c, f) =>
    `<path d="M400 420 Q500 380 600 470 Q700 380 800 420 L830 640 Q600 700 370 640Z" fill="${f}"/><path d="M400 420 Q500 380 600 470 Q700 380 800 420 L830 640 Q600 700 370 640Z" fill="url(#luz)"/><path d="M420 420 L470 250 M780 420 L730 250" stroke="${shade(c, -0.2)}" stroke-width="12"/><path d="M380 650 Q600 720 820 650" stroke="${shade(c, -0.2)}" stroke-width="10" fill="none"/>`,
  saia: (c, f) => {
    let fr = '';
    for (let x = 300; x <= 900; x += 30) fr += `<line x1="${x}" y1="820" x2="${x}" y2="900" stroke="${shade(c, -0.1)}" stroke-width="8"/>`;
    return `${fr}<path d="M460 330 L740 330 L900 820 L300 820Z" fill="${f}"/><path d="M460 330 L740 330 L900 820 L300 820Z" fill="url(#luz)"/><rect x="460" y="330" width="280" height="50" fill="${shade(c, -0.15)}"/>`;
  },
  vestido: (c, f) =>
    `<path d="M480 230 L520 230 Q600 330 680 230 L720 230 L740 420 Q700 480 720 520 L900 950 L300 950 L480 520 Q500 480 460 420Z" fill="${f}"/><path d="M480 230 L520 230 Q600 330 680 230 L720 230 L740 420 Q700 480 720 520 L900 950 L300 950 L480 520 Q500 480 460 420Z" fill="url(#luz)"/>`,
  chapeu: (c, f) =>
    `<ellipse cx="600" cy="720" rx="390" ry="130" fill="${f}"/><ellipse cx="600" cy="720" rx="390" ry="130" fill="url(#luz)"/><path d="M400 700 Q400 420 600 420 Q800 420 800 700Z" fill="${f}"/><path d="M400 700 Q400 420 600 420 Q800 420 800 700Z" fill="url(#luz)"/><path d="M405 640 Q600 690 795 640 L800 690 Q600 740 400 690Z" fill="#78350f"/>`,
  bone: (c, f) =>
    `<path d="M330 700 Q330 400 600 400 Q870 400 870 700Z" fill="${f}"/><path d="M330 700 Q330 400 600 400 Q870 400 870 700Z" fill="url(#luz)"/><path d="M600 400 L600 700 M470 420 Q440 560 450 700 M730 420 Q760 560 750 700" stroke="${shade(c, -0.2)}" stroke-width="6" fill="none"/><path d="M330 690 Q600 740 870 690 Q1000 720 990 770 Q600 820 300 760Z" fill="${shade(c, -0.25)}"/><circle cx="600" cy="400" r="18" fill="${shade(c, -0.25)}"/>`,
  cabide: (c) => {
    const one = (dx, dy, col) =>
      `<g transform="translate(${dx} ${dy})"><path d="M600 360 Q600 300 640 300 Q680 300 680 340 Q680 370 650 380 L600 410" stroke="#a8a29e" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M600 410 L300 600 Q280 620 310 625 L890 625 Q920 620 900 600Z" fill="none" stroke="${col}" stroke-width="34" stroke-linejoin="round"/></g>`;
    return one(0, 120, shade(c, 0.2)) + one(0, 60, shade(c, 0.1)) + one(0, 0, c);
  },
  prendedor: (c) => {
    let s = `<path d="M600 230 Q600 190 630 190 Q660 190 660 220 Q660 240 640 248 L600 268" stroke="#a8a29e" stroke-width="12" fill="none"/><rect x="290" y="270" width="620" height="40" rx="20" fill="${c}"/>`;
    for (let i = 0; i < 10; i++) {
      const x = 320 + i * 62;
      s += `<line x1="${x}" y1="310" x2="${x}" y2="${520 + (i % 2) * 40}" stroke="#a8a29e" stroke-width="5"/><rect x="${x - 14}" y="${520 + (i % 2) * 40}" width="28" height="80" rx="8" fill="${shade(c, 0.25)}"/>`;
    }
    return s;
  },
  organizador: (c) => {
    let s = `<path d="M240 520 L960 520 L960 820 L240 820Z" fill="${c}"/><path d="M240 520 L360 400 L1080 400 L960 520Z" fill="${shade(c, 0.25)}"/><path d="M960 520 L1080 400 L1080 700 L960 820Z" fill="${shade(c, -0.15)}"/>`;
    for (let i = 1; i < 6; i++) s += `<line x1="${240 + i * 144}" y1="520" x2="${360 + i * 144}" y2="400" stroke="${shade(c, -0.1)}" stroke-width="6"/>`;
    for (let j = 1; j < 4; j++) s += `<line x1="${240 + j * 30}" y1="${520 - j * 30}" x2="${960 + j * 30}" y2="${520 - j * 30}" stroke="${shade(c, -0.1)}" stroke-width="6"/>`;
    return s;
  },
  caixa: (c, f) =>
    `<path d="M300 480 L900 480 L900 880 L300 880Z" fill="${f}"/><path d="M300 480 L900 480 L900 880 L300 880Z" fill="url(#luz)"/><path d="M300 480 L420 380 L1020 380 L900 480Z" fill="${f}" opacity=".9"/><path d="M900 480 L1020 380 L1020 780 L900 880Z" fill="#000" opacity=".18"/><rect x="540" y="560" width="120" height="40" rx="20" fill="#1c1917" opacity=".7"/>`,
};

function svg({ desenho, cor, padrao: pd = 'liso', fundo = '#f1efe9', zoom = 1 }) {
  const fill = 'url(#pd)';
  const corpo = DESENHOS[desenho](cor, fill);
  const z = zoom * 1.15;
  const t = `transform="translate(600 600) scale(${z}) translate(-600 -640)"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${shade(fundo, 0.55)}"/><stop offset="1" stop-color="${fundo}"/></radialGradient>
<linearGradient id="luz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
<filter id="sombra" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26"/></filter>
${padrao('pd', pd, cor)}
</defs>
<rect width="1200" height="1200" fill="url(#bg)"/>
<g ${t}><ellipse cx="600" cy="985" rx="400" ry="38" fill="#1c1917" opacity=".16" filter="url(#sombra)"/>${corpo}</g>
</svg>`;
}

// id -> lista de fotos (a 1ª é a capa)
export const FOTOS = {
  'cob-estampado-casal': [{ desenho: 'dobrado', cor: '#1e3a8a', padrao: 'estrela' }, { desenho: 'dobrado', cor: '#1e3a8a', padrao: 'estrela', zoom: 1.7 }, { desenho: 'dobrado', cor: '#9d174d', padrao: 'poa', fundo: '#efe6ea' }],
  'cob-canelado-casal': [{ desenho: 'dobrado', cor: '#57534e', padrao: 'canelado' }, { desenho: 'dobrado', cor: '#57534e', padrao: 'canelado', zoom: 1.8 }, { desenho: 'dobrado', cor: '#0f766e', padrao: 'canelado', fundo: '#e6efed' }],
  'cob-rolinho': [{ desenho: 'rolinho', cor: '#b45309' }, { desenho: 'rolinho', cor: '#0e7490', fundo: '#e5eef0' }],
  'cob-baby-kit': [{ desenho: 'dobrado', cor: '#93c5fd', padrao: 'estrela', fundo: '#eaf0f7' }, { desenho: 'dobrado', cor: '#f9a8d4', padrao: 'estrela', fundo: '#f6eaf0' }],
  'fronha-kit4': [{ desenho: 'fronha', cor: '#e7e5e4', padrao: 'liso', fundo: '#e9e4da' }],
  'lencol-elastico-casal': [{ desenho: 'dobrado', cor: '#cbd5e1', padrao: 'listra' }, { desenho: 'dobrado', cor: '#cbd5e1', padrao: 'listra', zoom: 1.8 }],
  'lencol-elastico-queen': [{ desenho: 'dobrado', cor: '#a7f3d0', padrao: 'liso', fundo: '#e6efe9' }],
  'travesseiro-sublime': [{ desenho: 'travesseiro', cor: '#f5f5f4', fundo: '#e7e2d8' }, { desenho: 'travesseiro', cor: '#f5f5f4', fundo: '#e7e2d8', zoom: 1.6 }],
  'manta-cereja': [{ desenho: 'dobrado', cor: '#fef2f2', padrao: 'cereja', fundo: '#f3e8e6' }, { desenho: 'dobrado', cor: '#fef2f2', padrao: 'cereja', zoom: 1.9, fundo: '#f3e8e6' }],
  'manta-poa': [{ desenho: 'rolinho', cor: '#7c3aed', fundo: '#ece8f3' }],
  'manta-grid': [{ desenho: 'dobrado', cor: '#475569', padrao: 'xadrez' }],
  'pano-prato': [{ desenho: 'pano', cor: '#dc2626', padrao: 'xadrez', fundo: '#f1e9e4' }],
  'tapete-seda': [{ desenho: 'tapete', cor: '#7f1d1d', fundo: '#efe8e1' }, { desenho: 'tapete', cor: '#1e3a5f', fundo: '#e6eaf0' }],
  'tapete-pesinho': [{ desenho: 'tapete', cor: '#0f766e', fundo: '#e5efec' }],
  'short-fitness': [{ desenho: 'short', cor: '#111827', fundo: '#e9e9ec' }, { desenho: 'short', cor: '#be185d', fundo: '#f3e6ec' }, { desenho: 'short', cor: '#1d4ed8', fundo: '#e6ebf5' }],
  'conjunto-dryfit': [{ desenho: 'conjunto', cor: '#0d9488', fundo: '#e3efec' }, { desenho: 'conjunto', cor: '#7c3aed', fundo: '#ece6f5' }],
  'regata-dryfit': [{ desenho: 'regata', cor: '#f97316', fundo: '#f4ebe3' }],
  'calca-poliamida': [{ desenho: 'calca', cor: '#1f2937', fundo: '#e8e8ea' }],
  'camiseta-uv': [{ desenho: 'camiseta', cor: '#0284c7', fundo: '#e4eef5' }, { desenho: 'camiseta', cor: '#0284c7', zoom: 1.7, fundo: '#e4eef5' }],
  'camisa-colmeia': [{ desenho: 'camiseta', cor: '#16a34a', fundo: '#e5f0e7' }],
  'bone-liso': [{ desenho: 'bone', cor: '#1e293b', fundo: '#e8e9ec' }, { desenho: 'bone', cor: '#b91c1c', fundo: '#f2e5e4' }],
  'saida-zigue': [{ desenho: 'saia', cor: '#fde68a', padrao: 'croche', fundo: '#f3ede0' }],
  'vestido-croche': [{ desenho: 'vestido', cor: '#fafaf9', padrao: 'croche', fundo: '#e9e2d6' }, { desenho: 'vestido', cor: '#fafaf9', padrao: 'croche', zoom: 1.8, fundo: '#e9e2d6' }],
  'top-croche': [{ desenho: 'top', cor: '#fb7185', padrao: 'croche', fundo: '#f5e6e8' }],
  'chapeu-croche': [{ desenho: 'chapeu', cor: '#e7d3a8', padrao: 'croche', fundo: '#efe7d8' }],
  'short-croche': [{ desenho: 'short', cor: '#fafaf9', padrao: 'croche', fundo: '#e8e1d5' }],
  'cabide-aveludado': [{ desenho: 'cabide', cor: '#1c1917', fundo: '#e9e6e1' }],
  'cabide-prendedor': [{ desenho: 'prendedor', cor: '#0ea5e9', fundo: '#e5eef3' }],
  'organizador-gaveta': [{ desenho: 'organizador', cor: '#94a3b8', fundo: '#e8ebef' }],
  'caixa-pied': [{ desenho: 'caixa', cor: '#1c1917', padrao: 'pied', fundo: '#ebe8e3' }],
};

let total = 0;
for (const [id, fotos] of Object.entries(FOTOS)) {
  for (let i = 0; i < fotos.length; i++) {
    const buf = Buffer.from(svg(fotos[i]));
    const base = `${id}-${i + 1}`;
    const g = await sharp(buf).resize(1200, 1200).webp({ quality: 80 }).toBuffer();
    const m = await sharp(buf).resize(300, 300).webp({ quality: 72 }).toBuffer();
    writeFileSync(join(OUT, `${base}.webp`), g);
    writeFileSync(join(OUT, `${base}-300.webp`), m);
    total += g.length + m.length;
  }
}
console.log('fotos geradas:', Object.keys(FOTOS).length, 'produtos,', Math.round(total / 1024), 'KB no total');
