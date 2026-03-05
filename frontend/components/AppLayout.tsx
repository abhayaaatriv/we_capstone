'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import { api } from '@/lib/api';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const market = await api.getMarket();
        setStocks(market.stocks || []);
      } catch (error) {
        console.error('Failed to fetch stocks:', error);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Nav stocks={stocks} />
      <div className="h-[calc(100vh-110px)] overflow-y-auto">
        {children}
      </div>
    </>
  );
}