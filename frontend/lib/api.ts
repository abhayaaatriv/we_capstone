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
  getMarket: (q?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (limit != null) params.append("limit", String(limit));
    if (offset != null) params.append("offset", String(offset));
    const query = params.toString();
    return fetchAPI(`/market${query ? `?${query}` : ""}`);
  },
  getStock: (symbol: string) => fetchAPI(`/market/${symbol}`),
  getPortfolio: () => fetchAPI("/portfolio"),
  getTransactions: () => fetchAPI("/transactions"),

  // News
  getNews: (limit = 25) => fetchAPI(`/api/news?limit=${limit}`),
  refreshNews: () => fetchAPI("/api/news/refresh", { method: "POST" }),

  buy: (symbol: string, shares: number) =>
    fetchAPI("/trade/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, shares }),
    }),
  sell: (symbol: string, shares: number) =>
    fetchAPI("/trade/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, shares }),
    }),
};