import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/AppLayout';
import CursorGlowLayer from '@/components/CursorGlowLayer';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Finora — Mock Trading Simulator',
  description: 'Virtual stock market simulator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${poppins.variable}`}>
      <body className="bg-[#030a10] text-white min-h-screen overflow-x-hidden font-sans">
        <CursorGlowLayer />
        <div className="relative z-10 min-h-screen flex flex-col">
          <AppLayout>
            <main className="flex-1">{children}</main>
          </AppLayout>
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
