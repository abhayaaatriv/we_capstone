const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  getMarket: () => fetchAPI('/market'),
  getStock: (symbol: string) => fetchAPI(`/market/${symbol}`),
  getPortfolio: () => fetchAPI('/portfolio'),
  getTransactions: () => fetchAPI('/transactions'),
  buy: (symbol: string, shares: number) =>
    fetchAPI('/trade/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, shares }),
    }),
  sell: (symbol: string, shares: number) =>
    fetchAPI('/trade/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, shares }),
    }),
};
