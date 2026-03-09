"""Fetch NSE symbol list and cache it locally.

This script uses nsetools to pull the latest set of NSE symbols and saves them to
backend/nse_symbols.json so the backend can operate offline / without relying on
live API calls.

Usage:
  python scripts/fetch_nse_symbols.py

If you have network access, run this once and the backend will reuse the cached list.
"""

from pathlib import Path
import json

try:
    from nsetools import Nse
except ImportError:
    raise SystemExit("nsetools is not installed. Run `pip install nsetools` first.")

OUT_PATH = Path(__file__).parent.parent / "nse_symbols.json"

print("Fetching NSE symbol list...")

nse = Nse()
try:
    codes = nse.get_stock_codes()
except Exception as e:
    raise SystemExit(
        "Failed to fetch NSE symbols. This often happens due to network/DNS issues or NSE blocking. "
        "Make sure you have internet access and can reach https://www.nseindia.com. "
        f"Error: {e}"
    )

# Drop header row if present (older nsetools returned a dict with a 'SYMBOL' key)
if isinstance(codes, dict):
    symbols = [k for k in codes.keys() if k != "SYMBOL"]
elif isinstance(codes, list):
    symbols = codes
else:
    raise SystemExit(f"Unexpected nsetools format: {type(codes)}")

OUT_PATH.write_text(json.dumps(symbols, indent=2, ensure_ascii=False))
print(f"Saved {len(symbols)} symbols to {OUT_PATH}")
