import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { LojaProvider } from '@/components/Loja';
import { RegistraSW } from '@/components/RegistraSW';

export const metadata: Metadata = {
  title: 'Conexão Vendas — Atacado direto da indústria',
  description: 'Catálogo de atacado da Conexão Indústria & Varejo. Monte sua cotação e receba no WhatsApp.',
  manifest: '/manifest.json',
  icons: { icon: [{ url: '/favicon-48.png?v=3', sizes: '48x48' }, { url: '/favicon-32.png?v=3', sizes: '32x32' }], apple: '/apple-touch-icon.png?v=3' },
  appleWebApp: { capable: true, title: 'Conexão', statusBarStyle: 'default' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0c1f4f', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <LojaProvider>{children}</LojaProvider>
        <RegistraSW />
      </body>
    </html>
  );
}
