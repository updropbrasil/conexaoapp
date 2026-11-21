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
  icons: { icon: '/favicon-48.png', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Conexão', statusBarStyle: 'default' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f2a47', viewportFit: 'cover' };

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
