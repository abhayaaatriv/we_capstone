import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import CursorGlowLayer from '@/components/CursorGlowLayer';

const mono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Finora — Mock Trading Simulator',
  description: 'Virtual stock market simulator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="bg-[#030a10] text-white min-h-screen overflow-x-hidden">
        <CursorGlowLayer />
        <div className="relative z-10 min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
        </div>
        {/* Background grid */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,178,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,178,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </body>
    </html>
  );
}
