import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArrowFlow: Tangled Direction Puzzle & Monetization Engine',
  description:
    'Addictive ASMR arrow untangling puzzle game with procedural solvable labyrinths, Web Audio synthesis, Stripe in-app purchases, and turnkey commercial licensing.',
  keywords: [
    'arrow puzzle',
    'arrow out',
    'hyper-casual web game',
    'puzzle game',
    'game monetization',
    'turnkey game license',
    'crazygames poki web games',
  ],
  authors: [{ name: 'Samarth Nimangre', url: 'https://github.com/samarthnimangre-dev' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#030712',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col items-center">
        {children}
      </body>
    </html>
  );
}
